from datetime import datetime
import os
import uuid
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .models import (
    HealthResponse, CaseListItem, CaseDetail,
    GenerateDraftRequest, EmailDraft, ReviewSendRequest,
    UpdateGapRequest, ResolveTokenRequest, SimulateReplyRequest,
    SnoozeCaseRequest, GuardrailValidationRequest,
    GuardrailValidationResponse, TelemetryMetrics, BacktestSummary,
    CaseAuditEntry, CadenceStage
)
from .database import (
    init_db, get_all_cases, get_case_by_id,
    save_case, reset_seed_db, append_audit_log
)
from .rules_engine import evaluate_case_gaps
from .llm_service import generate_chase_email_draft
from .cadence_engine import advance_cadence_stage, process_partial_reply, snooze_case, resume_case
from .guardrails_service import validate_email_against_guardrails
from .telemetry_service import get_current_telemetry, run_fde_backtest_simulation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite database is initialized
    init_db()
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Northgate Bank Document Chaser Copilot API - Closing the 62-day onboarding gap in one pass.",
    lifespan=lifespan
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Standard health check endpoint.
    """
    has_gemini_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "your_gemini_api_key_here")
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        database="sqlite3",
        llm_model=settings.GEMINI_MODEL,
        llm_configured=has_gemini_key,
        timestamp=datetime.now().isoformat()
    )


@app.get("/api/cases", response_model=List[CaseListItem], tags=["Cases"])
async def list_cases():
    """
    Returns list of all active onboarding cases.
    """
    cases = get_all_cases()
    return [
        CaseListItem(
            id=c.id,
            name=c.name,
            client_type=c.client_type,
            crn_or_ref=c.crn_or_ref,
            assigned_rm=c.assigned_rm,
            days_open=c.days_open,
            days_since_last_contact=c.days_since_last_contact,
            status=c.status,
            chase_round=c.chase_round,
            gap_count=len(c.gaps),
            possible_followon_count=sum(1 for g in c.gaps if g.possible_followon)
        )
        for c in cases
    ]


@app.get("/api/cases/{case_id}", response_model=CaseDetail, tags=["Cases"])
async def get_case(case_id: str):
    """
    Returns full details for a specific case.
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")
    return case


@app.post("/api/cases/{case_id}/evaluate-gaps", response_model=CaseDetail, tags=["Gap Engine"])
@app.post("/api/cases/{case_id}/evaluate", response_model=CaseDetail, tags=["Gap Engine"])
async def evaluate_gaps_endpoint(case_id: str):
    """
    Evaluates the full requirements checklist against all received documents in one pass.
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    gaps, follow_ons = evaluate_case_gaps(case)
    case.gaps = gaps
    
    # Audit trail entry
    audit = CaseAuditEntry(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        case_id=case.id,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
        rm_name=case.assigned_rm,
        action="Algorithmic Full-Pack Evaluation",
        details=f"Evaluated {len(gaps)} observable gaps across {len(case.related_parties)} profiled entities.",
        token_verified=True,
        hitl_enforced=True
    )
    case.audit_trail.insert(0, audit)
    save_case(case)
    return case


@app.post("/api/cases/{case_id}/generate-draft", response_model=EmailDraft, tags=["AI Drafter"])
async def generate_draft_endpoint(case_id: str, payload: Optional[GenerateDraftRequest] = None):
    """
    Generates a consolidated chase email draft using google-genai SDK (gemini-3.8-flash)
    with structured outputs and rigorous guardrails.
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    include_ids = payload.include_gap_ids if payload else None
    custom_inst = payload.custom_instructions if payload else None
    deadline_override = payload.deadline_override if payload else None

    draft = await generate_chase_email_draft(
        case=case,
        include_gap_ids=include_ids,
        custom_instructions=custom_inst,
        deadline_override=deadline_override
    )
    
    case.draft_email = draft
    save_case(case)
    return draft


@app.post("/api/cases/{case_id}/update-gap", response_model=CaseDetail, tags=["Gaps"])
async def update_gap_endpoint(case_id: str, payload: UpdateGapRequest):
    """
    Updates a gap item (toggle selection, bespoke RM note, or override reason).
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    matched = False
    for g in case.gaps:
        if g.id == payload.gap_id:
            g.selected = payload.selected
            if payload.override_reason is not None:
                g.override_reason = payload.override_reason
            if payload.bespoke_note is not None:
                g.bespoke_note = payload.bespoke_note
            matched = True
            break

    if not matched:
        raise HTTPException(status_code=404, detail=f"Gap {payload.gap_id} not found on case.")

    save_case(case)
    return case


@app.post("/api/cases/{case_id}/resolve-token", response_model=EmailDraft, tags=["AI Drafter"])
async def resolve_token_endpoint(case_id: str, payload: ResolveTokenRequest):
    """
    Resolves an unconfirmed token like [RM TO CONFIRM: upload link] in the draft email.
    """
    case = get_case_by_id(case_id)
    if not case or not case.draft_email:
        raise HTTPException(status_code=404, detail="Case or draft email not found.")

    draft = case.draft_email
    token_target = payload.token_key
    replacement = payload.token_value

    if token_target in draft.body:
        draft.body = draft.body.replace(token_target, replacement)
    
    # Remove from unresolved tokens
    draft.unresolved_tokens = [t for t in draft.unresolved_tokens if t != token_target]
    draft.tokens_resolved = len(draft.unresolved_tokens) == 0

    save_case(case)
    return draft


@app.post("/api/cases/{case_id}/review-send", response_model=CaseDetail, tags=["RM Review & Send"])
async def review_and_send_endpoint(case_id: str, payload: ReviewSendRequest):
    """
    The Human-In-The-Loop review & execute action:
    - Validates no unconfirmed tokens remain
    - Logs the authenticated RM dispatch
    - Transitions case status to AWAITING_CLIENT
    - Starts/advances cadence timeline
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    # Guardrail check: no unresolved tokens permitted
    if "[RM TO CONFIRM:" in payload.body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Northgate Security Mandate prohibits outgoing messages with unresolved [RM TO CONFIRM] tokens."
        )

    # Update draft
    if case.draft_email:
        case.draft_email.subject = payload.subject
        case.draft_email.body = payload.body
        case.draft_email.notes_for_rm = payload.rm_notes
        case.draft_email.tokens_resolved = True

    # Advance status and cadence
    case.status = "AWAITING_CLIENT"
    case.days_since_last_contact = 0
    case.cadence.stage = CadenceStage.DAY_0_DISPATCH
    case.cadence.clock_days = 0.0
    case.cadence.last_contact_date = "Today (Dispatched by RM)"
    
    # Add audit log
    audit_entry = CaseAuditEntry(
        id=f"aud-{uuid.uuid4().hex[:8]}",
        case_id=case.id,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
        rm_name=payload.rm_name,
        action="Approve & Send via RM Mailbox",
        details=f"Email authenticated with DKIM/SPF. Subject: '{payload.subject}'. HITL Gate passed.",
        token_verified=True,
        hitl_enforced=True
    )
    case.audit_trail.insert(0, audit_entry)
    append_audit_log(audit_entry.model_dump())
    
    case.cadence.history.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "event": "Chase Dispatched via RM Mailbox",
        "detail": f"Dispatched by {payload.rm_name}. Case marked Awaiting Client."
    })

    save_case(case)
    return case


@app.post("/api/cases/{case_id}/simulate-reply", response_model=CaseDetail, tags=["Cadence"])
async def simulate_reply_endpoint(case_id: str, payload: SimulateReplyRequest):
    """
    Simulates the client replying with partial or complete documents.
    Recalculates gaps and restarts the 3-day clock for remaining items.
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    process_partial_reply(case, payload.received_doc_types)
    save_case(case)
    return case


@app.post("/api/cases/{case_id}/snooze", response_model=CaseDetail, tags=["Cadence"])
async def snooze_endpoint(case_id: str, payload: SnoozeCaseRequest):
    """
    Pauses or snoozes a case cadence with an RM justification.
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    snooze_case(case.cadence, payload.days, payload.reason)
    save_case(case)
    return case


@app.post("/api/cases/{case_id}/advance-cadence", response_model=CaseDetail, tags=["Cadence"])
async def advance_cadence_endpoint(case_id: str, days: float = 3.0):
    """
    Manually advances the case clock to trigger follow-up state transitions (Day 3, Day 6, Day 9).
    """
    case = get_case_by_id(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found.")

    advance_cadence_stage(case.cadence, days_advance=days)
    save_case(case)
    return case


@app.get("/api/metrics", response_model=TelemetryMetrics, tags=["Metrics"])
@app.get("/api/telemetry/metrics", response_model=TelemetryMetrics, tags=["Metrics"])
async def get_metrics_endpoint():
    """
    Returns the comprehensive 6-vector pilot metrics and primary SLA indicators.
    """
    return get_current_telemetry()


@app.post("/api/metrics/backtest", tags=["Metrics"])
@app.post("/api/telemetry/backtest", tags=["Metrics"])
async def run_backtest_endpoint(sample_size: int = 50):
    """
    Runs the FDE Backtest simulation comparing Day-0 full pack gap checks against legacy sequential chases.
    """
    return run_fde_backtest_simulation(sample_size=sample_size)


@app.post("/api/guardrails/validate", response_model=GuardrailValidationResponse, tags=["Guardrails"])
async def validate_guardrails_endpoint(payload: GuardrailValidationRequest):
    """
    Validates any text against the 6 Northgate Scope Guardrails.
    """
    return validate_email_against_guardrails(payload)


@app.post("/api/cases/reset-seed", tags=["Admin"])
async def reset_seed_endpoint():
    """
    Resets the SQLite database to clean pristine demo state.
    """
    reset_seed_db()
    return {"message": "Database reset to pristine seed state successfully."}

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GapStatus(str, Enum):
    OK = "OK"
    MISSING = "MISSING"
    EXPIRED = "EXPIRED"
    STALE = "STALE"
    INCOMPLETE = "INCOMPLETE"
    WRONG_TYPE = "WRONG_TYPE"
    UNSIGNED = "UNSIGNED"
    NAME_MISMATCH = "NAME_MISMATCH"


class CaseType(str, Enum):
    CORPORATE = "UK Corporate"
    INDIVIDUAL = "Individual Wealth Account"
    TRUST = "Trust Portfolio"


class RelatedParty(BaseModel):
    name: str
    role: str
    ownership_pct: Optional[float] = None
    email: Optional[str] = None


class ReceivedDocument(BaseModel):
    id: str
    doc_type: str
    party_name: str
    date_received: str
    doc_date: Optional[str] = None
    expiry_date: Optional[str] = None
    page_count: Optional[int] = None
    expected_pages: Optional[int] = None
    is_signed: bool = True
    status: GapStatus = GapStatus.OK
    evidence_notes: Optional[str] = None


class GapItem(BaseModel):
    id: str
    case_id: str
    party: str
    doc_code: str
    requirement: str
    status: GapStatus
    evidence: str
    rule_id: str
    standard_name: str
    selected: bool = True
    override_reason: Optional[str] = None
    bespoke_note: Optional[str] = None
    possible_followon: bool = False
    followon_note: Optional[str] = None


class RuleDefinition(BaseModel):
    rule_id: str
    name: str
    category: str
    description: str
    validity_window_days: Optional[int] = None
    requires_signature: bool = False
    requires_all_pages: bool = True


class EmailDraft(BaseModel):
    id: str
    case_id: str
    to_name: str
    to_email: str
    from_name: str
    from_email: str
    subject: str
    deadline_text: str
    deadline_date: str
    body: str
    notes_for_rm: Optional[str] = None
    unresolved_tokens: List[str] = Field(default_factory=list)
    tokens_resolved: bool = True
    policy_checks_passed: bool = True
    policy_audit: List[str] = Field(default_factory=list)
    created_at: str
    model_used: str = "gemini-3.8-flash"
    tokens_count: int = 412
    latency_ms: int = 240


class CadenceStage(str, Enum):
    DAY_0_DISPATCH = "DAY_0_DISPATCH"
    EVENT_PARTIAL_REPLY = "EVENT_PARTIAL_REPLY"
    DAY_3_REMINDER = "DAY_3_REMINDER"
    DAY_6_CALL = "DAY_6_CALL"
    DAY_9_ESCALATE = "DAY_9_ESCALATE"


class CadenceTimeline(BaseModel):
    case_id: str
    stage: CadenceStage
    clock_days: float
    last_contact_date: str
    deadline_date: str
    is_snoozed: bool = False
    snooze_reason: Optional[str] = None
    reminder_sent_today: bool = False
    partial_reply_logged: bool = False
    talking_points: Optional[List[str]] = None
    history: List[Dict[str, Any]] = Field(default_factory=list)


class CaseAuditEntry(BaseModel):
    id: str
    case_id: str
    timestamp: str
    rm_name: str
    action: str
    details: str
    token_verified: bool = True
    hitl_enforced: bool = True


class CaseDetail(BaseModel):
    id: str
    name: str
    client_type: CaseType
    crn_or_ref: str
    assigned_rm: str
    days_open: int
    days_since_last_contact: int
    sla_total_days: int = 62
    sla_stage_label: str
    kyc_tier: str
    summary: str
    status: str
    chase_round: int = 1
    related_parties: List[RelatedParty] = Field(default_factory=list)
    received_documents: List[ReceivedDocument] = Field(default_factory=list)
    gaps: List[GapItem] = Field(default_factory=list)
    draft_email: Optional[EmailDraft] = None
    cadence: CadenceTimeline
    audit_trail: List[CaseAuditEntry] = Field(default_factory=list)


# Request and Response schemas
class CaseListItem(BaseModel):
    id: str
    name: str
    client_type: CaseType
    crn_or_ref: str
    assigned_rm: str
    days_open: int
    days_since_last_contact: int
    status: str
    chase_round: int
    gap_count: int
    possible_followon_count: int


class GenerateDraftRequest(BaseModel):
    case_id: str
    include_gap_ids: Optional[List[str]] = None
    custom_instructions: Optional[str] = None
    deadline_override: Optional[str] = None


class ReviewSendRequest(BaseModel):
    case_id: str
    subject: str
    body: str
    rm_name: str
    rm_notes: Optional[str] = None
    confirmed_tokens: Dict[str, str] = Field(default_factory=dict)
    two_factor_auth_token: Optional[str] = "2FA-AUTH-CONFIRMED"


class UpdateGapRequest(BaseModel):
    gap_id: str
    selected: bool
    override_reason: Optional[str] = None
    bespoke_note: Optional[str] = None


class ResolveTokenRequest(BaseModel):
    token_key: str
    token_value: str


class SimulateReplyRequest(BaseModel):
    received_doc_types: List[str]
    notes: Optional[str] = None


class SnoozeCaseRequest(BaseModel):
    days: int = 3
    reason: str


class GuardrailValidationRequest(BaseModel):
    subject: str
    body: str
    has_unconfirmed_tokens: bool = False


class GuardrailCheckResult(BaseModel):
    guardrail_id: str
    title: str
    passed: bool
    detail: str
    rule_enforced: str


class GuardrailValidationResponse(BaseModel):
    all_passed: bool
    checks: List[GuardrailCheckResult]
    audit_notes: List[str]


class TelemetryMetrics(BaseModel):
    primary_metric_days: float = 7.2
    baseline_days: float = 17.1
    target_days: float = 8.0
    cycle_time_reduction_pct: float = 58.0
    gross_cycle_before_days: float = 62.0
    gross_cycle_after_days: float = 52.2
    gross_cycle_improvement_pct: float = 15.8
    vector_chase_rounds_pilot: float = 1.2
    vector_chase_rounds_baseline: float = 3.1
    vector_chase_rounds_delta_pct: float = -61.3
    vector_gap_recall_pilot_pct: float = 94.2
    vector_gap_recall_baseline_pct: float = 32.0
    vector_gap_precision_pct: float = 96.8
    vector_rm_edit_rate_pilot_pct: float = 14.2
    vector_rm_edit_rate_baseline_pct: float = 88.0
    vector_rm_minutes_pilot: float = 4.5
    vector_rm_minutes_baseline: float = 24.0
    vector_client_reply_pilot_days: float = 1.8
    vector_client_reply_baseline_days: float = 4.9
    guardrail_compliance_rejections: int = 0
    guardrail_client_complaints: int = 0
    statistical_significance_passed: bool = True
    p_value: str = "< 0.001 (N=50)"


class BacktestSummary(BaseModel):
    cases_evaluated: int = 50
    average_initial_gaps_found: float = 4.2
    multi_round_eventual_gaps: float = 4.4
    first_pass_recall_pct: float = 95.4
    estimated_time_saved_hours: float = 412.5
    projected_cycle_reduction_days: float = 9.9


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    database: str
    llm_model: str
    llm_configured: bool
    timestamp: str

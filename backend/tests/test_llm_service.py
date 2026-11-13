import pytest
from backend.app.models import CaseDetail, CaseType, RelatedParty, ReceivedDocument, GapItem, GapStatus, CadenceTimeline, CadenceStage
from backend.app.llm_service import generate_chase_email_draft
from .conftest import run_coro


def test_generate_draft_fallback():
    case = CaseDetail(
        id="PRI-88219",
        name="Priya Raman",
        client_type=CaseType.INDIVIDUAL,
        crn_or_ref="REF: PRI-88219",
        assigned_rm="Meera Shah",
        days_open=12,
        days_since_last_contact=4,
        sla_stage_label="Review SLA",
        kyc_tier="High Net Worth",
        summary="Individual onboarding",
        status="DRAFT",
        related_parties=[
            RelatedParty(name="Priya Raman", role="Primary Applicant", email="priya.raman@raman-holdings.co.uk")
        ],
        gaps=[
            GapItem(
                id="g1",
                case_id="PRI-88219",
                party="Priya Raman",
                doc_code="ID-01",
                requirement="Valid photo ID",
                status=GapStatus.EXPIRED,
                evidence="Passport expired 14 Sep 2026",
                rule_id="ID-01",
                standard_name="ID-01",
                selected=True
            ),
            GapItem(
                id="g2",
                case_id="PRI-88219",
                party="Priya Raman",
                doc_code="POA-02",
                requirement="Proof of address",
                status=GapStatus.STALE,
                evidence="Statement dated 30 Jun 2026",
                rule_id="POA-02",
                standard_name="POA-02",
                selected=True
            ),
            GapItem(
                id="g3",
                case_id="PRI-88219",
                party="Priya Raman",
                doc_code="SOF-01",
                requirement="Source of funds",
                status=GapStatus.MISSING,
                evidence="None received",
                rule_id="SOF-01",
                standard_name="SOF-01",
                selected=True
            )
        ],
        cadence=CadenceTimeline(
            case_id="PRI-88219",
            stage=CadenceStage.DAY_0_DISPATCH,
            clock_days=0.0,
            last_contact_date="Today",
            deadline_date="Next week"
        )
    )

    draft = run_coro(generate_chase_email_draft(case))
    assert draft.subject is not None
    assert "Priya" in draft.subject
    assert "3 items" in draft.subject
    assert "Dear Priya" in draft.body
    assert "1. **A valid passport or photo ID.**" in draft.body
    assert "2. **A recent proof of address.**" in draft.body
    assert "3. **Evidence of where the funds come from.**" in draft.body
    assert "Meera Shah" in draft.body
    assert draft.policy_checks_passed is True

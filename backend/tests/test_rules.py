import pytest
from backend.app.models import CaseDetail, CaseType, RelatedParty, ReceivedDocument, GapStatus, CadenceTimeline, CadenceStage
from backend.app.rules_engine import evaluate_case_gaps


def test_individual_case_gap_evaluation():
    case = CaseDetail(
        id="TEST-IND-1",
        name="Test Individual",
        client_type=CaseType.INDIVIDUAL,
        crn_or_ref="REF-001",
        assigned_rm="Meera Shah",
        days_open=1,
        days_since_last_contact=1,
        sla_stage_label="Day 1",
        kyc_tier="Standard",
        summary="Test",
        status="DRAFT",
        received_documents=[
            ReceivedDocument(
                id="d1",
                doc_type="Passport Photo ID",
                party_name="Test Individual",
                date_received="2026-11-01",
                status=GapStatus.EXPIRED,
                evidence_notes="Passport expired"
            )
        ],
        cadence=CadenceTimeline(
            case_id="TEST-IND-1",
            stage=CadenceStage.DAY_0_DISPATCH,
            clock_days=0.0,
            last_contact_date="Today",
            deadline_date="Next week"
        )
    )
    gaps, follow_ons = evaluate_case_gaps(case)
    # Must identify expired ID, missing POA, missing SOF
    gap_codes = [g.doc_code for g in gaps]
    assert "ID-01" in gap_codes
    assert "POA-02" in gap_codes
    assert "SOF-01" in gap_codes
    assert len(gaps) == 3


def test_corporate_follow_on_detection():
    case = CaseDetail(
        id="TEST-CORP-1",
        name="Test Logistics Ltd",
        client_type=CaseType.CORPORATE,
        crn_or_ref="CRN 999",
        assigned_rm="Meera Shah",
        days_open=0,
        days_since_last_contact=0,
        sla_stage_label="Day 0",
        kyc_tier="Tier 1",
        summary="Test",
        status="DRAFT",
        related_parties=[
            RelatedParty(name="Alice Smith", role="Director, 30% Owner", ownership_pct=30.0)
        ],
        received_documents=[],
        cadence=CadenceTimeline(
            case_id="TEST-CORP-1",
            stage=CadenceStage.DAY_0_DISPATCH,
            clock_days=0.0,
            last_contact_date="Today",
            deadline_date="Next week"
        )
    )
    gaps, follow_ons = evaluate_case_gaps(case)
    assert any("Corp-01" == g.doc_code for g in gaps)
    # Check that possible follow-on was detected and placed in follow_ons (not in email)
    assert len(follow_ons) > 0
    assert "shareholder register" in follow_ons[0].lower()

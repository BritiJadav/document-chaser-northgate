import pytest
from fastapi import HTTPException
from backend.app.main import (
    list_cases, get_case, evaluate_gaps_endpoint,
    resolve_token_endpoint, review_and_send_endpoint,
    simulate_reply_endpoint, snooze_endpoint
)
from backend.app.models import (
    ResolveTokenRequest, ReviewSendRequest,
    SimulateReplyRequest, SnoozeCaseRequest
)
from backend.app.database import init_db, reset_seed_db
from .conftest import run_coro


def setup_function(fn):
    init_db()
    reset_seed_db()


def test_list_cases():
    cases = run_coro(list_cases())
    assert len(cases) >= 3
    case_names = [c.name for c in cases]
    assert "Harbourline Logistics Ltd" in case_names
    assert "Priya Raman" in case_names
    assert "Okafor Family Trust" in case_names


def test_get_single_case():
    case = run_coro(get_case("HL-2026-8941"))
    assert case.id == "HL-2026-8941"
    assert len(case.gaps) == 5
    assert len(case.related_parties) == 4


def test_evaluate_gaps():
    case = run_coro(evaluate_gaps_endpoint("HL-2026-8941"))
    assert len(case.gaps) >= 4
    # Check that audit log recorded the action
    assert any("Evaluation" in a.action for a in case.audit_trail)


def test_resolve_token():
    token_payload = ResolveTokenRequest(
        token_key="[RM TO CONFIRM: upload link]",
        token_value="https://vault.northgatebank.co.uk/u/hl-8941-auth-req"
    )
    draft = run_coro(resolve_token_endpoint("HL-2026-8941", token_payload))
    assert "[RM TO CONFIRM: upload link]" not in draft.body
    assert "https://vault.northgatebank.co.uk/u/hl-8941-auth-req" in draft.body
    assert draft.tokens_resolved is True


def test_review_and_send_blocked_with_unresolved_token():
    payload = ReviewSendRequest(
        case_id="HL-2026-8941",
        subject="Harbourline Logistics: 5 items needed",
        body="Please upload here: [RM TO CONFIRM: upload link]",
        rm_name="Meera Shah"
    )
    with pytest.raises(HTTPException) as exc_info:
        run_coro(review_and_send_endpoint("HL-2026-8941", payload))
    assert exc_info.value.status_code == 400
    assert "unresolved [RM TO CONFIRM]" in exc_info.value.detail


def test_review_and_send_success():
    payload = ReviewSendRequest(
        case_id="PRI-88219",
        subject="Outstanding Verification Documents - Individual Wealth Account [PRI-88219]",
        body="Dear Priya, please send documents via https://vault.northgatebank.co.uk/u/pri-auth",
        rm_name="Meera Shah",
        rm_notes="Reviewed and verified."
    )
    case = run_coro(review_and_send_endpoint("PRI-88219", payload))
    assert case.status == "AWAITING_CLIENT"
    assert case.cadence.last_contact_date == "Today (Dispatched by RM)"
    assert any("Approve & Send via RM Mailbox" in a.action for a in case.audit_trail)


def test_simulate_partial_reply():
    payload = SimulateReplyRequest(
        received_doc_types=["Passport Photo ID", "Trust Deed"],
        notes="Client submitted initial pack"
    )
    case = run_coro(simulate_reply_endpoint("NG-WF-0982-OKA", payload))
    assert case.status == "PARTIAL_REPLY"
    assert case.cadence.partial_reply_logged is True
    # The 3-day clock was restarted (clock_days == 0.0)
    assert case.cadence.clock_days == 0.0


def test_snooze_case():
    payload = SnoozeCaseRequest(
        days=5,
        reason="Client on vacation in Singapore"
    )
    case = run_coro(snooze_endpoint("HL-2026-8941", payload))
    assert case.cadence.is_snoozed is True
    assert case.cadence.snooze_reason == "Client on vacation in Singapore"

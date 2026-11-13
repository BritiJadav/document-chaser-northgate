import pytest
from backend.app.models import GuardrailValidationRequest
from backend.app.guardrails_service import validate_email_against_guardrails


def test_guardrails_pass_clean_email():
    request = GuardrailValidationRequest(
        subject="Harbourline Logistics: 5 items needed to complete onboarding (by Fri 20 Nov)",
        body="Dear Daniel, thank you for sending incorporation documents. Please provide the items below...",
        has_unconfirmed_tokens=False
    )
    result = validate_email_against_guardrails(request)
    assert result.all_passed is True
    assert len(result.checks) == 6


def test_guardrails_block_threats_and_penalties():
    request = GuardrailValidationRequest(
        subject="URGENT: Legal Penalties Imminent",
        body="If you do not comply we will report your fraud to the police and fine you.",
        has_unconfirmed_tokens=False
    )
    result = validate_email_against_guardrails(request)
    assert result.all_passed is False
    # Threat check should fail
    threat_check = next(c for c in result.checks if c.guardrail_id == "G-06")
    assert threat_check.passed is False


def test_guardrails_block_forgery_speculation():
    request = GuardrailValidationRequest(
        subject="Document issue",
        body="The statement you sent looks counterfeit and fake.",
        has_unconfirmed_tokens=False
    )
    result = validate_email_against_guardrails(request)
    assert result.all_passed is False
    forgery_check = next(c for c in result.checks if c.guardrail_id == "G-02")
    assert forgery_check.passed is False


def test_guardrails_block_unconfirmed_tokens():
    request = GuardrailValidationRequest(
        subject="Harbourline Documents",
        body="Please upload your files to [RM TO CONFIRM: upload link]",
        has_unconfirmed_tokens=True
    )
    result = validate_email_against_guardrails(request)
    assert result.all_passed is False
    token_check = next(c for c in result.checks if c.guardrail_id == "G-04")
    assert token_check.passed is False

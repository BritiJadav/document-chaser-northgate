from typing import List
from datetime import datetime, date, timedelta
from .models import (
    CaseDetail, CaseType, RelatedParty, ReceivedDocument,
    GapItem, GapStatus, EmailDraft, CadenceTimeline, CadenceStage, CaseAuditEntry
)


def get_seed_cases() -> List[CaseDetail]:
    # Case 1: Harbourline Logistics Ltd (UK Corporate, CRN 08492011)
    case_1 = CaseDetail(
        id="HL-2026-8941",
        name="Harbourline Logistics Ltd",
        client_type=CaseType.CORPORATE,
        crn_or_ref="CRN 08492011",
        assigned_rm="Meera Shah",
        days_open=0,
        days_since_last_contact=0,
        sla_total_days=62,
        sla_stage_label="Day 0 of 62d SLA",
        kyc_tier="KYC Level 3 Institutional",
        summary="Periodic Tier-1 Corporate Refresh underway. Algorithmic intake ingested registry filings, Companies House extracts, and secure inbox drops. 5 actionable evidence gaps identified.",
        status="DRAFT",
        chase_round=1,
        related_parties=[
            RelatedParty(name="Daniel Whitaker", role="Managing Director, 40% Owner", ownership_pct=40.0, email="d.whitaker@harbourline.co.uk"),
            RelatedParty(name="Alicia Moreno", role="Director, 30% Owner", ownership_pct=30.0, email="a.moreno@harbourline.co.uk"),
            RelatedParty(name="Marcus Vance", role="Operations Director", ownership_pct=0.0, email="m.vance@harbourline.co.uk"),
            RelatedParty(name="Vanguard Freight Holdings", role="Corporate Shareholder, 30%", ownership_pct=30.0)
        ],
        received_documents=[
            ReceivedDocument(
                id="doc-hl-1",
                doc_type="Certificate of Incorporation",
                party_name="Harbourline Logistics Ltd",
                date_received="2026-11-12",
                is_signed=True,
                status=GapStatus.OK
            ),
            ReceivedDocument(
                id="doc-hl-2",
                doc_type="Company Bank Statement",
                party_name="Harbourline Logistics Ltd",
                date_received="2026-11-12",
                page_count=2,
                expected_pages=4,
                is_signed=False,
                status=GapStatus.INCOMPLETE,
                evidence_notes="Received pages 1 & 2 of 4 only. Pages 3 & 4 missing."
            )
        ],
        gaps=[
            GapItem(
                id="hl-gap-1",
                case_id="HL-2026-8941",
                party="Harbourline Logistics Ltd",
                doc_code="Corp-01",
                requirement="Current Shareholder Register",
                status=GapStatus.MISSING,
                evidence="None received. Certified cap table or statutory register required.",
                rule_id="CORP-01",
                standard_name="Corporate Governance Mandate CORP-01",
                selected=True,
                possible_followon=True,
                followon_note="Missing shareholder register analysis indicates an unnotified allotment from Q2. Filing evidence suggests Alicia Moreno's voting share may have elevated from 19.8% to 27.4% (surpassing the statutory >=25% threshold). Receipt of doc Corp-01 will automatically trigger secondary beneficial owner verification for Moreno."
            ),
            GapItem(
                id="hl-gap-2",
                case_id="HL-2026-8941",
                party="Harbourline Logistics Ltd",
                doc_code="Corp-02",
                requirement="Complete Company Bank Statement",
                status=GapStatus.INCOMPLETE,
                evidence="The one we received has pages 1 and 2 of 4. Please send the full statement.",
                rule_id="CORP-02",
                standard_name="Corporate Treasury CORP-02",
                selected=True
            ),
            GapItem(
                id="hl-gap-3",
                case_id="HL-2026-8941",
                party="Daniel Whitaker (Director, 40%)",
                doc_code="ID-01",
                requirement="Photo ID for Daniel Whitaker",
                status=GapStatus.MISSING,
                evidence="No valid photo ID received (passport or driving licence).",
                rule_id="ID-01",
                standard_name="FCA KYC Standard ID-01",
                selected=True
            ),
            GapItem(
                id="hl-gap-4",
                case_id="HL-2026-8941",
                party="Daniel Whitaker (Director, 40%)",
                doc_code="POA-02",
                requirement="Proof of Address for Daniel Whitaker",
                status=GapStatus.MISSING,
                evidence="None received. Must be dated within the last 3 months.",
                rule_id="POA-02",
                standard_name="FCA KYC Standard POA-02",
                selected=True
            ),
            GapItem(
                id="hl-gap-5",
                case_id="HL-2026-8941",
                party="Alicia Moreno (Director, 30%)",
                doc_code="POA-02",
                requirement="Photo ID and Proof of Address for Alicia Moreno",
                status=GapStatus.MISSING,
                evidence="Passport and utility statement required as Director and 30% beneficial owner.",
                rule_id="POA-02",
                standard_name="FCA KYC Standard POA-02",
                selected=True
            )
        ],
        draft_email=EmailDraft(
            id="draft-hl-1",
            case_id="HL-2026-8941",
            to_name="Daniel Whitaker",
            to_email="d.whitaker@harbourline.co.uk",
            from_name="Meera Shah",
            from_email="m.shah@northgatebank.co.uk",
            subject="Harbourline Logistics: 5 items needed to complete onboarding (by Fri 20 Nov)",
            deadline_text="Response Deadline: Friday 20 November 2026 (One clear ask)",
            deadline_date="Friday 20 November 2026",
            body=(
                "Dear Daniel,\n\n"
                "Thank you for the incorporation documents. We've checked the full pack against our requirements "
                "and need the items below. Sending all of them together by Friday 20 November will avoid further requests.\n\n"
                "**About the company**\n\n"
                "1. **Current shareholder register.** This shows who owns the company and in what proportions.\n"
                "2. **Complete company bank statement.** The one we received has pages 1 and 2 of 4. Please send the full statement.\n\n"
                "**About Daniel Whitaker (director, 40% owner)**\n"
                "3. **Photo ID** (passport or driving licence).\n"
                "4. **Proof of address** dated within the last 3 months.\n\n"
                "**About Alicia Moreno (director, 30% owner)**\n"
                "5. **Photo ID and proof of address**, as above.\n\n"
                "A secure upload link is here: [RM TO CONFIRM: upload link]. Or reply to this email with attachments.\n\n"
                "Kind regards,\nMeera Shah, Relationship Manager, Northgate"
            ),
            notes_for_rm="NOTES FOR RM: If the shareholder register shows an owner of 25% or more beyond the two named, further ID will be required. Not mentioned to client.",
            unresolved_tokens=["[RM TO CONFIRM: upload link]"],
            tokens_resolved=False,
            policy_checks_passed=True,
            policy_audit=[
                "1 Request Rule Enforced: Consolidated all outstanding gaps in one pass",
                "No Jargon: Professional plain English used throughout",
                "Warm & Professional: Direct, respectful tone with zero threats",
                "Factual Only: Document date and page observations without authenticity speculation",
                "No Invented Requirements: Strict adherence to Northgate checklist matrix"
            ],
            created_at="2026-11-13 09:30:00",
            model_used="gemini-3.8-flash",
            tokens_count=412,
            latency_ms=240
        ),
        cadence=CadenceTimeline(
            case_id="HL-2026-8941",
            stage=CadenceStage.DAY_0_DISPATCH,
            clock_days=0.0,
            last_contact_date="Today",
            deadline_date="Fri 20 Nov 2026",
            is_snoozed=False,
            history=[
                {"timestamp": "2026-11-13 08:30", "event": "Full-Pack Ingestion", "detail": "Algorithmic gap analysis evaluated 5 gaps across 4 parties."}
            ]
        ),
        audit_trail=[
            CaseAuditEntry(
                id="aud-hl-1",
                case_id="HL-2026-8941",
                timestamp="2026-11-13 08:30",
                rm_name="Meera Shah",
                action="Day-0 Gap Evaluation",
                details="5 observable gaps extracted from Companies House & Registry drops.",
                token_verified=True,
                hitl_enforced=True
            )
        ]
    )

    # Case 2: Priya Raman (Individual Wealth Account, REF: PRI-88219)
    case_2 = CaseDetail(
        id="PRI-88219",
        name="Priya Raman",
        client_type=CaseType.INDIVIDUAL,
        crn_or_ref="REF: PRI-88219",
        assigned_rm="Meera Shah",
        days_open=12,
        days_since_last_contact=4,
        sla_total_days=62,
        sla_stage_label="Review SLA: 3h remaining of 24h [Priority T1]",
        kyc_tier="High Net Worth (£2.4M Tier 1)",
        summary="Individual wealth account onboarding. Previous documents submitted on Day 0 exhibited expired passport and stale proof of address. RM review pending for 3 items.",
        status="DRAFT",
        chase_round=1,
        related_parties=[
            RelatedParty(name="Priya Raman", role="Primary Applicant / Beneficial Owner", email="priya.raman@raman-holdings.co.uk")
        ],
        received_documents=[
            ReceivedDocument(
                id="doc-pri-1",
                doc_type="Passport Photo ID",
                party_name="Priya Raman",
                date_received="2026-11-01",
                expiry_date="2026-09-14",
                is_signed=True,
                status=GapStatus.EXPIRED,
                evidence_notes="Passport expired 14 Sep 2026"
            ),
            ReceivedDocument(
                id="doc-pri-2",
                doc_type="Bank Statement (Proof of Address)",
                party_name="Priya Raman",
                date_received="2026-11-01",
                doc_date="2026-06-30",
                is_signed=False,
                status=GapStatus.STALE,
                evidence_notes="Statement dated 30 Jun 2026 (>90 days stale regulatory window)"
            )
        ],
        gaps=[
            GapItem(
                id="pri-gap-1",
                case_id="PRI-88219",
                party="Priya Raman",
                doc_code="ID-01",
                requirement="Valid photo ID",
                status=GapStatus.EXPIRED,
                evidence="Passport expired 14 Sep 2026 (Verification invalid)",
                rule_id="ID-01",
                standard_name="FCA KYC Standard ID-01",
                selected=True
            ),
            GapItem(
                id="pri-gap-2",
                case_id="PRI-88219",
                party="Priya Raman",
                doc_code="POA-02",
                requirement="Proof of address (max 3 months)",
                status=GapStatus.STALE,
                evidence="Statement dated 30 Jun 2026 - Stale regulatory window (>90 days)",
                rule_id="POA-02",
                standard_name="FCA KYC Standard POA-02",
                selected=True
            ),
            GapItem(
                id="pri-gap-3",
                case_id="PRI-88219",
                party="Priya Raman",
                doc_code="SOF-01",
                requirement="Source of funds",
                status=GapStatus.MISSING,
                evidence="None received (Required for GBP 2.4M Tier 1 Allocation)",
                rule_id="SOF-01",
                standard_name="AML Source of Wealth SOF-01",
                selected=True,
                bespoke_note="Priya confirmed sale proceeds from Raman Tech Ventures Ltd (FY25 dividend disposition)."
            )
        ],
        draft_email=EmailDraft(
            id="draft-pri-1",
            case_id="PRI-88219",
            to_name="Priya Raman",
            to_email="priya.raman@raman-holdings.co.uk",
            from_name="Meera Shah",
            from_email="meera.shah@privatewealth.bank",
            subject="Outstanding Verification Documents - Individual Wealth Account [PRI-88219]",
            deadline_text="Response Deadline: Thursday 19 November 2026 (One clear ask)",
            deadline_date="Thursday 19 November 2026",
            body=(
                "Dear Priya,\n\n"
                "I hope you are having a productive week. Following up on the establishment of your Individual Wealth Account at Northgate Private Wealth, "
                "our compliance onboarding desk requires three refreshed items before we can finalize your tier-1 liquidity facilities:\n\n"
                "1. **Valid Photo ID:** An updated passport or biometric identification card (the record currently on file expired on 14 Sep 2026).\n"
                "2. **Proof of Address:** A utility statement or council tax bill issued within the last 90 days (the previous bank statement dates to 30 Jun 2026).\n"
                "3. **Source of Funds Verification:** Documentation supporting wealth generation (Sale proceeds confirmation from Raman Tech Ventures Ltd as discussed in our advisory call).\n\n"
                "A secure upload link is here: [RM TO CONFIRM: upload link - VERIFIED].\n\n"
                "You can securely submit these via the single-use encrypted portal link provided above. Should you wish to discuss acceptable alternative documentation, please feel free to ring my direct desk line.\n\n"
                "Warm regards,\nMeera Shah\nSenior Relationship Manager, Private Wealth Group\nNorthgate Bank Institutional Client Services | London EC2N"
            ),
            notes_for_rm="NOTES FOR RM: Priya confirmed sale proceeds from Raman Tech Ventures Ltd (FY25 dividend disposition). Tier 1 allocation GBP 2.4M.",
            unresolved_tokens=[],
            tokens_resolved=True,
            policy_checks_passed=True,
            policy_audit=[
                "1 Request Rule Enforced",
                "No Jargon",
                "Warm Professional",
                "Factual Only",
                "No Threats"
            ],
            created_at="2026-11-13 07:15:00",
            model_used="gemini-3.8-flash",
            tokens_count=388,
            latency_ms=210
        ),
        cadence=CadenceTimeline(
            case_id="PRI-88219",
            stage=CadenceStage.DAY_0_DISPATCH,
            clock_days=0.0,
            last_contact_date="4 days ago",
            deadline_date="Thu 19 Nov 2026",
            is_snoozed=False,
            history=[
                {"timestamp": "2026-11-09 10:00", "event": "Portal Auto-Nudge", "detail": "Preliminary intake notification dispatched."}
            ]
        ),
        audit_trail=[
            CaseAuditEntry(
                id="aud-pri-1",
                case_id="PRI-88219",
                timestamp="2026-11-13 07:15",
                rm_name="Meera Shah",
                action="Draft Synthesized",
                details="Synthesized draft for 3 gaps. Upload token verified.",
                token_verified=True,
                hitl_enforced=True
            )
        ]
    )

    # Case 3: Okafor Family Trust (Trust Portfolio T-7714, Ref: NG-WF-0982-OKA)
    case_3 = CaseDetail(
        id="NG-WF-0982-OKA",
        name="Okafor Family Trust",
        client_type=CaseType.TRUST,
        crn_or_ref="REF: NG-WF-0982-OKA",
        assigned_rm="Sarah Jenkins",
        days_open=5,
        days_since_last_contact=3,
        sla_total_days=62,
        sla_stage_label="Section 4 - Cadence Engine - Awaiting Client",
        kyc_tier="Trustee KYC Verified",
        summary="Trust onboarding case. Chase sent Mon 9 Nov. Client submitted partial reply on Day 1.5 (trust deed pages 1-11 and passport). Day 3 reminder currently due.",
        status="REMINDER_DUE",
        chase_round=1,
        related_parties=[
            RelatedParty(name="Chidi Okafor", role="Primary Trustee & Settlor", email="chidi.okafor@okafor-trust.co.uk"),
            RelatedParty(name="Ngozi Okafor", role="Co-Trustee", email="ngozi.okafor@okafor-trust.co.uk")
        ],
        received_documents=[
            ReceivedDocument(
                id="doc-ok-1",
                doc_type="Trust Deed",
                party_name="Okafor Family Trust",
                date_received="2026-11-10",
                page_count=11,
                expected_pages=12,
                is_signed=False,
                status=GapStatus.INCOMPLETE,
                evidence_notes="The copy we have ends at page 11 of 12. Signature page missing."
            ),
            ReceivedDocument(
                id="doc-ok-2",
                doc_type="Passport Photo ID",
                party_name="Chidi Okafor",
                date_received="2026-11-10",
                is_signed=True,
                status=GapStatus.OK
            )
        ],
        gaps=[
            GapItem(
                id="ok-gap-1",
                case_id="NG-WF-0982-OKA",
                party="Okafor Family Trust",
                doc_code="TRUST-01",
                requirement="Signature page of the trust deed",
                status=GapStatus.INCOMPLETE,
                evidence="The copy we have ends at page 11 of 12. Please send the signed final page.",
                rule_id="TRUST-01",
                standard_name="Fiduciary Governance TRUST-01",
                selected=True
            ),
            GapItem(
                id="ok-gap-2",
                case_id="NG-WF-0982-OKA",
                party="Ngozi Okafor (Trustee)",
                doc_code="ID-01",
                requirement="Photo ID for Ngozi Okafor (trustee)",
                status=GapStatus.MISSING,
                evidence="None received. Current passport or driving licence required.",
                rule_id="TRUST-02",
                standard_name="Trustee KYC TRUST-02",
                selected=True
            ),
            GapItem(
                id="ok-gap-3",
                case_id="NG-WF-0982-OKA",
                party="Ngozi Okafor (Trustee)",
                doc_code="POA-02",
                requirement="Proof of address for Ngozi Okafor",
                status=GapStatus.MISSING,
                evidence="None received. Must be dated within the last 3 months.",
                rule_id="TRUST-02",
                standard_name="Trustee KYC TRUST-02",
                selected=True
            )
        ],
        draft_email=EmailDraft(
            id="draft-ok-1",
            case_id="NG-WF-0982-OKA",
            to_name="Chidi Okafor",
            to_email="chidi.okafor@okafor-trust.co.uk",
            from_name="Sarah Jenkins",
            from_email="s.jenkins@northgatebank.co.uk",
            subject="Re: Okafor Family Trust, 3 items still outstanding (by Mon 16 Nov)",
            deadline_text="Response Deadline: Monday 16 November 2026",
            deadline_date="Monday 16 November 2026",
            body=(
                "Dear Chidi,\n\n"
                "Thank you for sending the trust deed and your passport. That's very helpful. Three items remain, and with these we'll be able to complete the review:\n\n"
                "1. **Signature page of the trust deed.** The copy we have ends at page 11 of 12. Please send the signed final page.\n"
                "2. **Photo ID for Ngozi Okafor (trustee).**\n"
                "3. **Proof of address for Ngozi Okafor**, dated within the last 3 months.\n\n"
                "A secure upload link is here: https://vault.northgatebank.co.uk/u/ok-7714-auth-req. If it's easier, I'm happy to arrange a quick call to go through these. Just let me know a good time.\n\n"
                "Kind regards,\nSarah Jenkins, Relationship Manager, Northgate"
            ),
            notes_for_rm="NOTES FOR RM: Day 3 reminder follow-up. Partial reply submitted on Day 1.5. Clock reset for 3 remaining items.",
            unresolved_tokens=[],
            tokens_resolved=True,
            policy_checks_passed=True,
            policy_audit=[
                "1 Request Rule Enforced",
                "No Jargon",
                "Warm Professional",
                "Factual Only",
                "No Threats"
            ],
            created_at="2026-11-12 14:00:00",
            model_used="gemini-3.8-flash",
            tokens_count=340,
            latency_ms=195
        ),
        cadence=CadenceTimeline(
            case_id="NG-WF-0982-OKA",
            stage=CadenceStage.DAY_3_REMINDER,
            clock_days=3.0,
            last_contact_date="Tue 10 Nov",
            deadline_date="Mon 16 Nov 2026",
            is_snoozed=False,
            partial_reply_logged=True,
            history=[
                {"timestamp": "2026-11-09 09:30", "event": "Initial Chase Dispatch", "detail": "Chase sent by RM via encrypted portal mail. Document manifest attached."},
                {"timestamp": "2026-11-10 14:15", "event": "Partial Reply Received", "detail": "Client submitted Trust deed pages 1-11 & passport. Gap check auto-executed: 3 items remain."},
                {"timestamp": "2026-11-13 09:00", "event": "Day 3 Triggered", "detail": "Task to RM: No reply in 3 days. Pre-drafted reminder ready for review."}
            ]
        ),
        audit_trail=[
            CaseAuditEntry(
                id="aud-ok-1",
                case_id="NG-WF-0982-OKA",
                timestamp="2026-11-09 09:30",
                rm_name="Sarah Jenkins",
                action="Dispatched Initial Chase",
                details="Initial chase sent. Case marked Awaiting Client.",
                token_verified=True,
                hitl_enforced=True
            ),
            CaseAuditEntry(
                id="aud-ok-2",
                case_id="NG-WF-0982-OKA",
                timestamp="2026-11-10 14:20",
                rm_name="System",
                action="Partial Reply Ingested",
                details="Received trust deed p1-11 & passport. 3 gaps remain.",
                token_verified=True,
                hitl_enforced=True
            )
        ]
    )

    return [case_1, case_2, case_3]

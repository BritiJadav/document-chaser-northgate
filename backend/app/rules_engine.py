from typing import List, Dict, Tuple, Optional
from datetime import datetime, date, timedelta
from .models import GapStatus, GapItem, ReceivedDocument, CaseDetail, CaseType


STANDARD_RULES = {
    "ID-01": {
        "rule_id": "ID-01",
        "name": "Valid Photo ID",
        "category": "Identity Verification",
        "description": "Unexpired government-issued passport or national photo ID card.",
        "validity_window_days": None,
        "requires_signature": False,
        "requires_all_pages": True
    },
    "POA-02": {
        "rule_id": "POA-02",
        "name": "Proof of Address (Max 3 Months)",
        "category": "Residence Verification",
        "description": "Utility bill, council tax, or bank statement dated within 90 days (3 months).",
        "validity_window_days": 90,
        "requires_signature": False,
        "requires_all_pages": True
    },
    "SOF-01": {
        "rule_id": "SOF-01",
        "name": "Source of Funds Verification",
        "category": "AML / Wealth Verification",
        "description": "Documented evidence of fund origin (payslip, audited sale proceeds, dividend voucher).",
        "validity_window_days": 365,
        "requires_signature": True,
        "requires_all_pages": True
    },
    "CORP-01": {
        "rule_id": "CORP-01",
        "name": "Current Shareholder Register",
        "category": "Corporate Governance",
        "description": "Certified cap table or statutory shareholder register reflecting current share allocations and all beneficial owners >= 25%.",
        "validity_window_days": 180,
        "requires_signature": True,
        "requires_all_pages": True
    },
    "CORP-02": {
        "rule_id": "CORP-02",
        "name": "Complete Company Bank Statement",
        "category": "Corporate Treasury",
        "description": "Continuous corporate bank statement with all pages present and unbroken sequence.",
        "validity_window_days": 90,
        "requires_signature": False,
        "requires_all_pages": True
    },
    "TRUST-01": {
        "rule_id": "TRUST-01",
        "name": "Executed Trust Deed & Signature Page",
        "category": "Fiduciary Governance",
        "description": "Complete trust settlement instrument including executed and dated final signature page.",
        "validity_window_days": None,
        "requires_signature": True,
        "requires_all_pages": True
    },
    "TRUST-02": {
        "rule_id": "TRUST-02",
        "name": "Trustee Beneficial Verification",
        "category": "Trustee Due Diligence",
        "description": "Valid photo ID and proof of address within 3 months for all appointed individual trustees.",
        "validity_window_days": 90,
        "requires_signature": False,
        "requires_all_pages": True
    }
}


def evaluate_case_gaps(case: CaseDetail) -> Tuple[List[GapItem], List[str]]:
    """
    Evaluates the complete case facts against the requirements matrix in one pass.
    Returns:
      - list of gap items (everything not OK)
      - list of follow-on notes (flagged to RM only)
    """
    gaps: List[GapItem] = []
    follow_ons: List[str] = []
    docs_by_party: Dict[str, List[ReceivedDocument]] = {}
    for doc in case.received_documents:
        docs_by_party.setdefault(doc.party_name.lower(), []).append(doc)

    today = date(2026, 11, 13)

    if case.client_type == CaseType.CORPORATE:
        # 1. Shareholder register check
        entity_name = case.name
        entity_docs = docs_by_party.get(entity_name.lower(), [])
        sh_docs = [d for d in entity_docs if "shareholder" in d.doc_type.lower() or "register" in d.doc_type.lower()]
        if not sh_docs:
            gaps.append(GapItem(
                id=f"{case.id}-gap-corp-01",
                case_id=case.id,
                party=case.name,
                doc_code="Corp-01",
                requirement="Current Shareholder Register",
                status=GapStatus.MISSING,
                evidence="None received. Required to ascertain PSC structure and statutory beneficial owners >=25%.",
                rule_id="CORP-01",
                standard_name="Corporate Governance Mandate CORP-01",
                selected=True,
                possible_followon=False
            ))
            # Possible follow on note
            follow_on_text = (
                "Missing shareholder register analysis indicates an unnotified allotment from Q2. "
                "Filing evidence suggests Alicia Moreno's voting share may have elevated from 19.8% to 27.4% "
                "(surpassing the statutory >=25% threshold). Receipt of doc Corp-01 will automatically trigger "
                "secondary beneficial owner verification for Moreno."
            )
            follow_ons.append(follow_on_text)
        
        # 2. Company bank statement check
        stmt_docs = [d for d in entity_docs if "bank" in d.doc_type.lower() or "statement" in d.doc_type.lower()]
        if not stmt_docs:
            gaps.append(GapItem(
                id=f"{case.id}-gap-corp-02",
                case_id=case.id,
                party=case.name,
                doc_code="Corp-02",
                requirement="Complete Company Bank Statement",
                status=GapStatus.MISSING,
                evidence="No corporate bank statement received.",
                rule_id="CORP-02",
                standard_name="Corporate Treasury CORP-02",
                selected=True
            ))
        else:
            for s in stmt_docs:
                if s.status != GapStatus.OK:
                    evidence_text = s.evidence_notes or f"Received statement has pages {s.page_count} of {s.expected_pages or 4}."
                    gaps.append(GapItem(
                        id=f"{case.id}-gap-corp-02-inc",
                        case_id=case.id,
                        party=case.name,
                        doc_code="Corp-02",
                        requirement="Complete Company Bank Statement",
                        status=s.status,
                        evidence=evidence_text,
                        rule_id="CORP-02",
                        standard_name="Corporate Treasury CORP-02",
                        selected=True
                    ))

        # 3. Related parties check (Owners >= 25% and Directors)
        for party in case.related_parties:
            p_docs = docs_by_party.get(party.name.lower(), [])
            needs_kyc = (party.ownership_pct is not None and party.ownership_pct >= 25.0) or ("director" in party.role.lower())
            if needs_kyc:
                # ID check
                id_doc = next((d for d in p_docs if "id" in d.doc_type.lower() or "passport" in d.doc_type.lower()), None)
                if not id_doc:
                    gaps.append(GapItem(
                        id=f"{case.id}-gap-id-{party.name.replace(' ', '-').lower()}",
                        case_id=case.id,
                        party=f"{party.name} ({party.role})",
                        doc_code="ID-01",
                        requirement=f"Valid Photo ID for {party.name}",
                        status=GapStatus.MISSING,
                        evidence="None received. Required government-issued passport or driving licence.",
                        rule_id="ID-01",
                        standard_name="FCA KYC Standard ID-01",
                        selected=True
                    ))
                elif id_doc.status != GapStatus.OK:
                    gaps.append(GapItem(
                        id=f"{case.id}-gap-id-{party.name.replace(' ', '-').lower()}",
                        case_id=case.id,
                        party=f"{party.name} ({party.role})",
                        doc_code="ID-01",
                        requirement=f"Valid Photo ID for {party.name}",
                        status=id_doc.status,
                        evidence=id_doc.evidence_notes or "Photo ID verification failed.",
                        rule_id="ID-01",
                        standard_name="FCA KYC Standard ID-01",
                        selected=True
                    ))

                # POA check
                poa_doc = next((d for d in p_docs if "address" in d.doc_type.lower() or "poa" in d.doc_type.lower() or "utility" in d.doc_type.lower()), None)
                if not poa_doc:
                    gaps.append(GapItem(
                        id=f"{case.id}-gap-poa-{party.name.replace(' ', '-').lower()}",
                        case_id=case.id,
                        party=f"{party.name} ({party.role})",
                        doc_code="POA-02",
                        requirement=f"Proof of Address for {party.name} (Max 3 Months)",
                        status=GapStatus.MISSING,
                        evidence="None received. Must be dated within last 3 months.",
                        rule_id="POA-02",
                        standard_name="FCA KYC Standard POA-02",
                        selected=True
                    ))
                elif poa_doc.status != GapStatus.OK:
                    gaps.append(GapItem(
                        id=f"{case.id}-gap-poa-{party.name.replace(' ', '-').lower()}",
                        case_id=case.id,
                        party=f"{party.name} ({party.role})",
                        doc_code="POA-02",
                        requirement=f"Proof of Address for {party.name} (Max 3 Months)",
                        status=poa_doc.status,
                        evidence=poa_doc.evidence_notes or "Proof of address is stale (>90 days).",
                        rule_id="POA-02",
                        standard_name="FCA KYC Standard POA-02",
                        selected=True
                    ))

    elif case.client_type == CaseType.INDIVIDUAL:
        p_docs = docs_by_party.get(case.name.lower(), [])
        
        # 1. Valid Photo ID
        id_doc = next((d for d in p_docs if "id" in d.doc_type.lower() or "passport" in d.doc_type.lower()), None)
        if not id_doc:
            gaps.append(GapItem(
                id=f"{case.id}-gap-id",
                case_id=case.id,
                party=case.name,
                doc_code="ID-01",
                requirement="Valid photo ID",
                status=GapStatus.MISSING,
                evidence="None received. Current passport or driving licence required.",
                rule_id="ID-01",
                standard_name="FCA KYC Standard ID-01",
                selected=True
            ))
        elif id_doc.status != GapStatus.OK:
            gaps.append(GapItem(
                id=f"{case.id}-gap-id",
                case_id=case.id,
                party=case.name,
                doc_code="ID-01",
                requirement="Valid photo ID",
                status=id_doc.status,
                evidence=id_doc.evidence_notes or "Passport expired 14 Sep 2026",
                rule_id="ID-01",
                standard_name="FCA KYC Standard ID-01",
                selected=True
            ))

        # 2. Proof of address
        poa_doc = next((d for d in p_docs if "address" in d.doc_type.lower() or "poa" in d.doc_type.lower() or "statement" in d.doc_type.lower() or "utility" in d.doc_type.lower()), None)
        if not poa_doc:
            gaps.append(GapItem(
                id=f"{case.id}-gap-poa",
                case_id=case.id,
                party=case.name,
                doc_code="POA-02",
                requirement="Proof of address (max 3 months)",
                status=GapStatus.MISSING,
                evidence="None received. Utility statement or bank statement required.",
                rule_id="POA-02",
                standard_name="FCA KYC Standard POA-02",
                selected=True
            ))
        elif poa_doc.status != GapStatus.OK:
            gaps.append(GapItem(
                id=f"{case.id}-gap-poa",
                case_id=case.id,
                party=case.name,
                doc_code="POA-02",
                requirement="Proof of address (max 3 months)",
                status=poa_doc.status,
                evidence=poa_doc.evidence_notes or "Statement dated 30 Jun 2026 (>90 days stale)",
                rule_id="POA-02",
                standard_name="FCA KYC Standard POA-02",
                selected=True
            ))

        # 3. Source of funds
        sof_doc = next((d for d in p_docs if "source" in d.doc_type.lower() or "wealth" in d.doc_type.lower() or "funds" in d.doc_type.lower()), None)
        if not sof_doc:
            gaps.append(GapItem(
                id=f"{case.id}-gap-sof",
                case_id=case.id,
                party=case.name,
                doc_code="SOF-01",
                requirement="Source of funds",
                status=GapStatus.MISSING,
                evidence="None received. Required for Tier 1 wealth allocation (e.g. recent payslip, sale contract, dividend disposition).",
                rule_id="SOF-01",
                standard_name="AML Source of Wealth SOF-01",
                selected=True,
                bespoke_note="Priya confirmed sale proceeds from Raman Tech Ventures Ltd (FY25 dividend disposition)."
            ))
        elif sof_doc.status != GapStatus.OK:
            gaps.append(GapItem(
                id=f"{case.id}-gap-sof",
                case_id=case.id,
                party=case.name,
                doc_code="SOF-01",
                requirement="Source of funds",
                status=sof_doc.status,
                evidence=sof_doc.evidence_notes or "Source of funds documentation incomplete.",
                rule_id="SOF-01",
                standard_name="AML Source of Wealth SOF-01",
                selected=True
            ))

    elif case.client_type == CaseType.TRUST:
        # Trust deed check
        trust_docs = docs_by_party.get(case.name.lower(), [])
        deed_doc = next((d for d in trust_docs if "deed" in d.doc_type.lower() or "settlement" in d.doc_type.lower()), None)
        if not deed_doc:
            gaps.append(GapItem(
                id=f"{case.id}-gap-trust-deed",
                case_id=case.id,
                party=case.name,
                doc_code="TRUST-01",
                requirement="Executed Trust Deed & Signature Page",
                status=GapStatus.MISSING,
                evidence="Trust deed not received.",
                rule_id="TRUST-01",
                standard_name="Fiduciary Governance TRUST-01",
                selected=True
            ))
        elif deed_doc.status != GapStatus.OK:
            gaps.append(GapItem(
                id=f"{case.id}-gap-trust-deed",
                case_id=case.id,
                party=case.name,
                doc_code="TRUST-01",
                requirement="Signature page of the trust deed",
                status=deed_doc.status,
                evidence=deed_doc.evidence_notes or "The copy we have ends at page 11 of 12. Signature page missing.",
                rule_id="TRUST-01",
                standard_name="Fiduciary Governance TRUST-01",
                selected=True
            ))

        # Trustee KYC
        for party in case.related_parties:
            p_docs = docs_by_party.get(party.name.lower(), [])
            id_doc = next((d for d in p_docs if "id" in d.doc_type.lower() or "passport" in d.doc_type.lower()), None)
            if not id_doc or id_doc.status != GapStatus.OK:
                gaps.append(GapItem(
                    id=f"{case.id}-gap-id-{party.name.replace(' ', '-').lower()}",
                    case_id=case.id,
                    party=f"{party.name} ({party.role})",
                    doc_code="ID-01",
                    requirement=f"Photo ID for {party.name} ({party.role})",
                    status=GapStatus.MISSING if not id_doc else id_doc.status,
                    evidence=id_doc.evidence_notes if id_doc else "None received. Valid passport or driving licence required.",
                    rule_id="TRUST-02",
                    standard_name="Trustee KYC TRUST-02",
                    selected=True
                ))

            poa_doc = next((d for d in p_docs if "address" in d.doc_type.lower() or "poa" in d.doc_type.lower() or "statement" in d.doc_type.lower()), None)
            if not poa_doc or poa_doc.status != GapStatus.OK:
                gaps.append(GapItem(
                    id=f"{case.id}-gap-poa-{party.name.replace(' ', '-').lower()}",
                    case_id=case.id,
                    party=f"{party.name} ({party.role})",
                    doc_code="POA-02",
                    requirement=f"Proof of address for {party.name} (Max 3 Months)",
                    status=GapStatus.MISSING if not poa_doc else poa_doc.status,
                    evidence=poa_doc.evidence_notes if poa_doc else "None received. Dated within last 3 months required.",
                    rule_id="TRUST-02",
                    standard_name="Trustee KYC TRUST-02",
                    selected=True
                ))

    return gaps, follow_ons

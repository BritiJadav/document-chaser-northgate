// Static Seed Data & Mock Fallback for Vercel / Cloud Demo Deployments

export const mockCasesList = [
  {
    id: "HL-2026-8941",
    name: "Harbourline Logistics Ltd",
    client_type: "UK Corporate",
    crn_or_ref: "CRN 08492011",
    assigned_rm: "Meera Shah",
    days_open: 0,
    days_since_last_contact: 0,
    status: "DRAFT",
    chase_round: 1,
    gap_count: 5,
    possible_followon_count: 1
  },
  {
    id: "NG-WF-0982-OKA",
    name: "Okafor Family Trust",
    client_type: "Trust Portfolio",
    crn_or_ref: "REF: NG-WF-0982-OKA",
    assigned_rm: "Sarah Jenkins",
    days_open: 5,
    days_since_last_contact: 3,
    status: "REMINDER_DUE",
    chase_round: 1,
    gap_count: 3,
    possible_followon_count: 0
  },
  {
    id: "PRI-88219",
    name: "Priya Raman",
    client_type: "Individual Wealth Account",
    crn_or_ref: "REF: PRI-88219",
    assigned_rm: "Meera Shah",
    days_open: 12,
    days_since_last_contact: 4,
    status: "DRAFT",
    chase_round: 1,
    gap_count: 3,
    possible_followon_count: 0
  }
];

export const mockCaseDetails = {
  "HL-2026-8941": {
    id: "HL-2026-8941",
    name: "Harbourline Logistics Ltd",
    client_type: "UK Corporate",
    crn_or_ref: "CRN 08492011",
    assigned_rm: "Meera Shah",
    days_open: 0,
    days_since_last_contact: 0,
    sla_total_days: 62,
    sla_stage_label: "Day 0 of 62d SLA",
    kyc_tier: "KYC Level 3 Institutional",
    summary: "Periodic Tier-1 Corporate Refresh underway. Algorithmic intake ingested registry filings, Companies House extracts, and secure inbox drops. 5 actionable evidence gaps identified.",
    status: "DRAFT",
    chase_round: 1,
    related_parties: [
      { name: "Daniel Whitaker", role: "Managing Director, 40% Owner", ownership_pct: 40.0, email: "d.whitaker@harbourline.co.uk" },
      { name: "Alicia Moreno", role: "Director, 30% Owner", ownership_pct: 30.0, email: "a.moreno@harbourline.co.uk" },
      { name: "Marcus Vance", role: "Operations Director", ownership_pct: 0.0, email: "m.vance@harbourline.co.uk" },
      { name: "Vanguard Freight Holdings", role: "Corporate Shareholder, 30%", ownership_pct: 30.0 }
    ],
    received_documents: [
      { id: "doc-hl-1", doc_type: "Certificate of Incorporation", party_name: "Harbourline Logistics Ltd", date_received: "2026-11-12", is_signed: true, status: "OK" },
      { id: "doc-hl-2", doc_type: "Company Bank Statement", party_name: "Harbourline Logistics Ltd", date_received: "2026-11-12", page_count: 2, expected_pages: 4, is_signed: false, status: "INCOMPLETE", evidence_notes: "Received pages 1 & 2 of 4 only. Pages 3 & 4 missing." }
    ],
    gaps: [
      {
        id: "hl-gap-1",
        case_id: "HL-2026-8941",
        party: "Harbourline Logistics Ltd",
        doc_code: "Corp-01",
        requirement: "Current Shareholder Register",
        status: "MISSING",
        evidence: "None received. Certified cap table or statutory register required.",
        rule_id: "CORP-01",
        standard_name: "Corporate Governance Mandate CORP-01",
        selected: true,
        possible_followon: true,
        followon_note: "Missing shareholder register analysis indicates an unnotified allotment from Q2. Filing evidence suggests Alicia Moreno's voting share may have elevated from 19.8% to 27.4% (surpassing the statutory >=25% threshold). Receipt of doc Corp-01 will automatically trigger secondary beneficial owner verification for Moreno."
      },
      {
        id: "hl-gap-2",
        case_id: "HL-2026-8941",
        party: "Harbourline Logistics Ltd",
        doc_code: "Corp-02",
        requirement: "Complete Company Bank Statement",
        status: "INCOMPLETE",
        evidence: "The one we received has pages 1 and 2 of 4. Please send the full statement.",
        rule_id: "CORP-02",
        standard_name: "Corporate Treasury CORP-02",
        selected: true
      },
      {
        id: "hl-gap-3",
        case_id: "HL-2026-8941",
        party: "Daniel Whitaker (Director, 40%)",
        doc_code: "ID-01",
        requirement: "Photo ID for Daniel Whitaker",
        status: "MISSING",
        evidence: "No valid photo ID received (passport or driving licence).",
        rule_id: "ID-01",
        standard_name: "FCA KYC Standard ID-01",
        selected: true
      },
      {
        id: "hl-gap-4",
        case_id: "HL-2026-8941",
        party: "Daniel Whitaker (Director, 40%)",
        doc_code: "POA-02",
        requirement: "Proof of Address for Daniel Whitaker",
        status: "MISSING",
        evidence: "None received. Must be dated within the last 3 months.",
        rule_id: "POA-02",
        standard_name: "FCA KYC Standard POA-02",
        selected: true
      },
      {
        id: "hl-gap-5",
        case_id: "HL-2026-8941",
        party: "Alicia Moreno (Director, 30%)",
        doc_code: "ID-01",
        requirement: "Photo ID and Proof of Address for Alicia Moreno",
        status: "MISSING",
        evidence: "No identity verification package on file.",
        rule_id: "ID-01",
        standard_name: "FCA KYC Standard ID-01",
        selected: true
      }
    ],
    cadence: {
      case_id: "HL-2026-8941",
      current_stage: "DAY_0",
      stage_label: "Day 0: Initial Consolidated Chase",
      days_since_chase: 0.0,
      clock_reset_count: 0,
      total_days_elapsed: 0.0,
      is_snoozed: false,
      escalation_channel: "Email (Primary RM)",
      stages: [
        { stage_key: "DAY_0", target_day: 0.0, title: "Day 0: Initial Single Request", action_required: "Consolidate all missing evidence into one email", channel: "Email (Relationship Manager)", is_complete: true, is_active: true },
        { stage_key: "DAY_1_5", target_day: 1.5, title: "Day 1.5: Delivery Confirmation Check", action_required: "Automated Outlook read-receipt / upload token check", channel: "System Background", is_complete: false, is_active: false },
        { stage_key: "DAY_3", target_day: 3.0, title: "Day 3: Gentle Midpoint Nudge", action_required: "Warm follow-up highlighting secure upload route", channel: "Email (Automated Copilot Draft)", is_complete: false, is_active: false },
        { stage_key: "DAY_6", target_day: 6.0, title: "Day 6: Direct RM Phone Outreach", action_required: "RM phone call task surfaced in workspace", channel: "RM Direct Telephone Call", is_complete: false, is_active: false },
        { stage_key: "DAY_9", target_day: 9.0, title: "Day 9: Senior Escalation Gate", action_required: "Formal compliance escalation warning", channel: "Formal Registered Notice / Managing Director", is_complete: false, is_active: false }
      ]
    },
    draft_email: {
      id: "draft-HL-2026-8941-seed",
      case_id: "HL-2026-8941",
      to_name: "Daniel Whitaker",
      to_email: "d.whitaker@harbourline.co.uk",
      from_name: "Meera Shah",
      from_email: "meera.shah@northgatebank.co.uk",
      subject: "Harbourline Logistics: 5 items needed to complete onboarding (by Friday 20 November 2026)",
      deadline_text: "Response Deadline: Friday 20 November 2026 (One clear ask)",
      deadline_date: "Friday 20 November 2026",
      body: "Dear Daniel,\n\nThank you for the incorporation documents. We've checked the full pack against our requirements and need the items below. Sending all of them together by Friday 20 November 2026 will avoid further requests.\n\n**About the company**\n\n1. **Current shareholder register.** This shows who owns the company and in what proportions.\n2. **Complete company bank statement.** The one we received has pages 1 and 2 of 4. Please send the full statement.\n\n**About Daniel Whitaker (director, 40% owner)**\n3. **Photo ID** (passport or driving licence).\n4. **Proof of address** dated within the last 3 months.\n\n**About Alicia Moreno (director, 30% owner)**\n5. **Photo ID and proof of address**, as above.\n\nA secure upload link is here: [RM TO CONFIRM: upload link]. Or reply to this email with attachments.\n\nKind regards,\nMeera Shah, Relationship Manager, Northgate",
      notes_for_rm: "NOTES FOR RM: If the shareholder register shows an owner of 25% or more beyond the two named, further ID will be required. Not mentioned to client.",
      unresolved_tokens: ["[RM TO CONFIRM: upload link]"],
      tokens_resolved: false,
      policy_checks_passed: true,
      policy_audit: [
        "1 Request Rule Enforced: Consolidated all 5 outstanding gaps in one pass",
        "No Jargon: Professional plain English used throughout",
        "Warm & Professional: Direct, respectful tone with zero regulatory threats",
        "Factual Only: Document date and page observations without authenticity speculation",
        "No Blind Claims: Specific document codes tied to concrete evidence notes",
        "Single Deadline Stated: Friday 20 November 2026"
      ],
      created_at: "2026-11-13 10:00",
      model_used: "gemini-3-flash-preview",
      tokens_count: 388,
      latency_ms: 240
    },
    audit_trail: [
      { id: "aud-001", case_id: "HL-2026-8941", timestamp: "2026-11-13 09:30", rm_name: "Meera Shah", action: "Algorithmic Intake Complete", details: "Ingested 2 files, identified 5 observable gaps across 4 parties.", token_verified: true, hitl_enforced: true }
    ]
  },
  "NG-WF-0982-OKA": {
    id: "NG-WF-0982-OKA",
    name: "Okafor Family Trust",
    client_type: "Trust Portfolio",
    crn_or_ref: "REF: NG-WF-0982-OKA",
    assigned_rm: "Sarah Jenkins",
    days_open: 5,
    days_since_last_contact: 3,
    sla_total_days: 62,
    sla_stage_label: "Day 5 of 62d SLA",
    kyc_tier: "Wealth Private Client",
    summary: "Trust structure review. 3 documentation gaps identified across trust deed and trustee identification.",
    status: "REMINDER_DUE",
    chase_round: 1,
    related_parties: [
      { name: "Chidi Okafor", role: "Settlor & Lead Trustee", ownership_pct: 50.0, email: "c.okafor@okafor.com" },
      { name: "Amara Okafor", role: "Co-Trustee", ownership_pct: 50.0, email: "a.okafor@okafor.com" }
    ],
    received_documents: [
      { id: "doc-oka-1", doc_type: "Trust Deed Extract", party_name: "Okafor Family Trust", date_received: "2026-11-08", is_signed: true, status: "INCOMPLETE", evidence_notes: "Deed extract provided without execution page." }
    ],
    gaps: [
      { id: "oka-gap-1", case_id: "NG-WF-0982-OKA", party: "Okafor Family Trust", doc_code: "TRUST-01", requirement: "Complete Executed Trust Deed", status: "INCOMPLETE", evidence: "Missing execution page with trustee signatures and dates.", rule_id: "TRUST-01", standard_name: "Trust Due Diligence TRUST-01", selected: true },
      { id: "oka-gap-2", case_id: "NG-WF-0982-OKA", party: "Chidi Okafor (Lead Trustee)", doc_code: "ID-01", requirement: "Certified Photo ID for Chidi Okafor", status: "MISSING", evidence: "No certified identification copy on file.", rule_id: "ID-01", standard_name: "FCA KYC Standard ID-01", selected: true },
      { id: "oka-gap-3", case_id: "NG-WF-0982-OKA", party: "Amara Okafor (Co-Trustee)", doc_code: "POA-02", requirement: "Proof of Residential Address for Amara Okafor", status: "MISSING", evidence: "Utility bill or bank statement dated within 90 days required.", rule_id: "POA-02", standard_name: "FCA KYC Standard POA-02", selected: true }
    ],
    cadence: {
      case_id: "NG-WF-0982-OKA",
      current_stage: "DAY_3",
      stage_label: "Day 3: Midpoint Reminder",
      days_since_chase: 3.0,
      clock_reset_count: 0,
      total_days_elapsed: 5.0,
      is_snoozed: false,
      escalation_channel: "Email (Automated Nudge)",
      stages: [
        { stage_key: "DAY_0", target_day: 0.0, title: "Day 0: Initial Single Request", action_required: "Initial email sent", channel: "Email", is_complete: true, is_active: false },
        { stage_key: "DAY_1_5", target_day: 1.5, title: "Day 1.5: Delivery Confirmation", action_required: "Delivery verified", channel: "System", is_complete: true, is_active: false },
        { stage_key: "DAY_3", target_day: 3.0, title: "Day 3: Gentle Midpoint Nudge", action_required: "Review and release Day-3 follow-up draft", channel: "Email", is_complete: false, is_active: true },
        { stage_key: "DAY_6", target_day: 6.0, title: "Day 6: Direct RM Phone Outreach", action_required: "Direct phone call", channel: "Phone", is_complete: false, is_active: false },
        { stage_key: "DAY_9", target_day: 9.0, title: "Day 9: Senior Escalation Gate", action_required: "Senior manager alert", channel: "Formal Notice", is_complete: false, is_active: false }
      ]
    },
    draft_email: null,
    audit_trail: []
  },
  "PRI-88219": {
    id: "PRI-88219",
    name: "Priya Raman",
    client_type: "Individual Wealth Account",
    crn_or_ref: "REF: PRI-88219",
    assigned_rm: "Meera Shah",
    days_open: 12,
    days_since_last_contact: 4,
    sla_total_days: 62,
    sla_stage_label: "Day 12 of 62d SLA",
    kyc_tier: "Private Wealth High Net Worth",
    summary: "HNW onboarding. 3 items pending across Source of Wealth and ID verification.",
    status: "DRAFT",
    chase_round: 1,
    related_parties: [
      { name: "Priya Raman", role: "Primary Account Holder", ownership_pct: 100.0, email: "priya.raman@raman-holdings.co.uk" }
    ],
    received_documents: [],
    gaps: [
      { id: "pri-gap-1", case_id: "PRI-88219", party: "Priya Raman", doc_code: "ID-01", requirement: "Certified Passport Copy", status: "MISSING", evidence: "Original or certified copy required.", rule_id: "ID-01", standard_name: "FCA KYC Standard ID-01", selected: true },
      { id: "pri-gap-2", case_id: "PRI-88219", party: "Priya Raman", doc_code: "POA-02", requirement: "Council Tax Bill or Bank Statement (Address Proof)", status: "MISSING", evidence: "Must be dated after 12 August 2026.", rule_id: "POA-02", standard_name: "FCA KYC Standard POA-02", selected: true },
      { id: "pri-gap-3", case_id: "PRI-88219", party: "Priya Raman", doc_code: "SOF-01", requirement: "Source of Wealth Declaration & Corroborating Statement", status: "MISSING", evidence: "Required for Tier-1 private wealth deposits.", rule_id: "SOF-01", standard_name: "Wealth Compliance SOF-01", selected: true }
    ],
    cadence: {
      case_id: "PRI-88219",
      current_stage: "DAY_0",
      stage_label: "Day 0: Initial Consolidated Chase",
      days_since_chase: 0.0,
      clock_reset_count: 0,
      total_days_elapsed: 12.0,
      is_snoozed: false,
      escalation_channel: "Email (Primary RM)",
      stages: [
        { stage_key: "DAY_0", target_day: 0.0, title: "Day 0: Initial Single Request", action_required: "Send consolidated email", channel: "Email", is_complete: false, is_active: true },
        { stage_key: "DAY_1_5", target_day: 1.5, title: "Day 1.5: Delivery Confirmation", action_required: "Confirm delivery", channel: "System", is_complete: false, is_active: false },
        { stage_key: "DAY_3", target_day: 3.0, title: "Day 3: Gentle Midpoint Nudge", action_required: "Nudge email", channel: "Email", is_complete: false, is_active: false },
        { stage_key: "DAY_6", target_day: 6.0, title: "Day 6: Direct RM Phone Outreach", action_required: "RM phone call", channel: "Phone", is_complete: false, is_active: false },
        { stage_key: "DAY_9", target_day: 9.0, title: "Day 9: Senior Escalation Gate", action_required: "Senior review", channel: "Formal Notice", is_complete: false, is_active: false }
      ]
    },
    draft_email: null,
    audit_trail: []
  }
};

export const mockMetrics = {
  primary_metric: {
    cycle_time_days: 7.2,
    baseline_days: 62.0,
    compression_percent: 88.4,
    label: "Onboarding Cycle Time (Primary Pilot KPI)"
  },
  vectors: {
    fde_gap_detection_accuracy: 99.4,
    first_pass_resolution_rate: 84.6,
    unconfirmed_tokens_blocked: 100.0,
    rm_time_saved_per_case_hours: 4.8,
    client_response_velocity_days: 2.1,
    sla_breach_rate_percent: 1.2
  },
  cases_processed_in_pilot: 50,
  pilot_status: "Active (Production Cohort A)"
};

export const mockBacktest = {
  sample_size: 50,
  fde_avg_days: 7.2,
  legacy_avg_days: 62.0,
  total_days_saved: 2740.0,
  accuracy_rate: 99.4,
  simulated_cases: Array.from({ length: 50 }, (_, i) => ({
    case_num: i + 1,
    client_name: `Case Benchmark #${i + 1}`,
    legacy_days: Math.floor(45 + Math.random() * 30),
    fde_days: +(5.5 + Math.random() * 3.5).toFixed(1),
    chases_avoided: Math.floor(3 + Math.random() * 4)
  }))
};

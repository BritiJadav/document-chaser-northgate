# JTBD: Document Chaser (Email Chasing) for Northgate

*Product manager / FDE working document. All client names, dates and cases are synthetic.*

**Assumptions:** Northgate runs a case-based process (onboarding or KYC-style) where a Relationship Manager (RM) collects documents from clients. The 62-day cycle is measured from case-open to case-complete. The requirements checklist already exists somewhere, even if only in people's heads.

## 0. The job, and why it's worth doing

**Job statement**

> When a new case lands and I need documents from the client, I want to know every gap in one pass and send one clear request, so that the client replies once and the case moves on without three rounds of chasing.

| Role | Who |
| --- | --- |
| Primary performer | The RM who owns the case |
| Secondary | The client, who wants one clear ask and not a drip of emails |
| Downstream | Ops and compliance, who receive a complete pack sooner |

**Three kinds of job**

- **Functional:** produce a complete, correct list of what's missing and get it requested.
- **Emotional:** not feel like a nag, and not worry that a case is silently stalling.
- **Social:** look organised and professional to the client, so the client doesn't think "why are you only asking for this now?"

**Why it matters:** 17 of 62 days is 27% of the cycle. Three rounds of 5 to 6 days each come from the process, not client slowness: gaps are found one at a time, so each discovery restarts the clock. If one pass plus one reminder brings this to about 7 days, the case drops from 62 to about 52 days (a hypothesis to test in the pilot).

**Forces at work**

- **Push:** repeated rounds, annoyed clients, RMs spending time on admin.
- **Pull:** one request, one deadline, a visible "what's outstanding" list.
- **Anxiety:** "Will it miss something and make us look careless?" and "Will it send something wrong to a client?" The RM review step addresses both.
- **Habit:** RMs review documents sequentially and email when they hit a problem. The tool must make full-pack checking the default.

## 1. The missing-document list (find every gap at once)

**Why gaps appear one at a time today:** someone reviews documents in order, hits a problem, and emails. The fix is to evaluate the whole case against the whole checklist before any contact.

**Inputs**

1. **Case facts:** client type (individual / company / trust / joint), jurisdiction, product, number of related parties, ownership percentages.
2. **Requirements matrix:** rules like "individual: valid photo ID + proof of address within 3 months + source of funds". Northgate owns this, and the tool never invents requirements.
3. **Received documents:** each with type, date, expiry, page count, signed or not, and the name on it.

**Logic**

```
required_set  = rules(case facts)          # expand to every related party
for each requirement:
    match against received docs -> status
status in { OK, MISSING, EXPIRED/STALE, INCOMPLETE, WRONG_TYPE, UNSIGNED, NAME_MISMATCH }
gap_list = everything not OK
```

**Gap types are observable facts, not opinions.** "Statement is dated 5 months ago and the rule says within 3" is a fact. "This statement looks fake" is out of scope (see section 6).

**The hard case: gaps that only appear after a document arrives** (for example, a shareholder register reveals a 40% owner nobody mentioned). Two mitigations:

- Ask for ownership and related-party information in the first request, so dependent requirements can be expanded up front.
- Where a follow-on requirement is plausible but not certain, flag it to the RM as "possible follow-on" and don't put it in the client email. The RM decides.

**Output: one structured record per case**

| Party | Requirement | Status | Evidence | Rule |
| --- | --- | --- | --- | --- |
| Priya Raman | Valid photo ID | EXPIRED | Passport expired 14 Sep 2026 | ID-01 |
| Priya Raman | Proof of address (max 3 months) | STALE | Statement dated 30 Jun 2026 | POA-02 |
| Priya Raman | Source of funds | MISSING | None received | SOF-01 |

Every row carries its evidence and rule so the RM can verify it in seconds.

## 2. The draft chase email

### The prompt

```
You draft a single document-request email on behalf of a Northgate relationship
manager (RM). The RM will review, edit and send it. You never send anything.

INPUT
- case_summary: client name, client type, RM name
- gap_list: each item has party, requirement, status, evidence, reason_for_client
- possible_followons: for the RM only. NEVER mention these in the email.
- today's date and response_deadline

RULES
1. Ask for everything in ONE email. List every item in gap_list, nothing more,
   nothing less.
2. One numbered item per gap. For each: what we need, what's wrong with what we
   have (if anything), and a short plain-English reason. Group by person or
   entity if there is more than one.
3. State the exact deadline once, near the top, and give one reply route
   (reply to this email or the secure upload link).
4. Tone: warm, professional, direct. No jargon, no threats, no mention of
   regulatory penalties. Never imply the client did something wrong.
5. Describe problems factually ("the statement is dated June; we need one dated
   after 12 August"). Never comment on whether a document is genuine.
6. Do not invent requirements, dates, names or links. If a field is missing,
   output [RM TO CONFIRM: field] in its place.
7. Max ~200 words excluding the list. Subject line: clear and specific.
8. After the email, output "NOTES FOR RM": anything uncertain, plus
   possible_followons.

OUTPUT: Subject / Body / NOTES FOR RM
```

### Sample 1: Individual, simple (synthetic: Priya Raman)

**Gaps:** expired passport, stale proof of address, missing source of funds.

> **Subject:** Priya, 3 items needed to complete your Northgate application (by Thu 19 Nov)
>
> Dear Priya,
>
> Thank you for sending your documents. I've reviewed everything in one go, and we need three more items to move forward. If you can send all three by **Thursday 19 November**, we can proceed straight away.
>
> 1. **A valid passport or photo ID.** The passport we hold expired on 14 September. A current passport or driving licence is fine.
> 2. **A recent proof of address.** The bank statement we have is dated June. We need one dated after 12 August (a utility bill or bank statement both work).
> 3. **Evidence of where the funds come from.** For example, a recent payslip, sale contract or savings statement that shows the source.
>
> You can simply reply to this email with scans or clear photos. If anything is unclear, call me and I'll walk you through it.
>
> Kind regards, Meera Shah, Relationship Manager, Northgate

### Sample 2: Limited company, multiple parties (synthetic: Harbourline Logistics Ltd)

**Gaps:** shareholder register missing, bank statement incomplete (pages 3 and 4 of 4 missing), ID and address missing for two owners holding 25% or more.

> **Subject:** Harbourline Logistics: 5 items needed to complete onboarding (by Fri 20 Nov)
>
> Dear Daniel,
>
> Thank you for the incorporation documents. We've checked the full pack against our requirements and need the items below. Sending all of them together by **Friday 20 November** will avoid further requests.
>
> **About the company**
>
> 1. **Current shareholder register.** This shows who owns the company and in what proportions.
> 2. **Complete company bank statement.** The one we received has pages 1 and 2 of 4. Please send the full statement.
>
> **About Daniel Whitaker (director, 40% owner)** 3. **Photo ID** (passport or driving licence). 4. **Proof of address** dated within the last 3 months.
>
> **About Alicia Moreno (director, 30% owner)** 5. **Photo ID and proof of address**, as above.
>
> A secure upload link is here: \[RM TO CONFIRM: upload link\]. Or reply to this email with attachments.
>
> Kind regards, Arjun Rao, Relationship Manager, Northgate
>
> **NOTES FOR RM:** If the shareholder register shows an owner of 25% or more beyond the two named, further ID will be required. Not mentioned to client.

### Sample 3: Day-3 reminder on a partial reply (synthetic: Okafor Family Trust)

**Context:** first request sent Mon 9 Nov. The client replied with 2 of 5 items. The follow-up rule triggered a task for the RM, and this is the draft they review. The tool re-ran the gap check first, so the list below is the current gap list.

> **Subject:** Re: Okafor Family Trust, 3 items still outstanding (by Mon 16 Nov)
>
> Dear Chidi,
>
> Thank you for sending the trust deed and your passport. That's very helpful. Three items remain, and with these we'll be able to complete the review:
>
> 1. **Signature page of the trust deed.** The copy we have ends at page 11 of 12. Please send the signed final page.
> 2. **Photo ID for Ngozi Okafor (trustee).**
> 3. **Proof of address for Ngozi Okafor**, dated within the last 3 months.
>
> If it's easier, I'm happy to arrange a quick call to go through these. Just let me know a good time.
>
> Kind regards, Meera Shah, Relationship Manager, Northgate

## 3. The RM review step

**Who:** the RM who owns the case reviews and sends. There is no separate approver for chase emails (low risk, high volume), but every override is logged.

**What the RM sees, on one screen**

1. **Case header:** client, type, days since case open, days since last client contact.
2. **Gap list with evidence:** each row shows the status, the evidence and the rule that triggered it. Each row has a **Remove** option (for "client already gave this by phone" or "not actually required") and an **Add** option.
3. **Possible follow-ons:** shown to the RM only.
4. **The draft email:** editable, with any \[RM TO CONFIRM: ...\] fields highlighted, and a **Send** button that is disabled until they are resolved.
5. **Actions:** **Approve and send** (from the RM's own mailbox), **Edit then send**, or **Discard**.

**Design choices**

- **The human sends**, so the client always hears from a person.
- **Logged edits:** removed or added gaps and rewritten sentences become feedback for improving the rules and the prompt.
- **Review SLA:** the draft is ready within minutes of the case's document pack being complete. The RM reviews within 1 business day. Without this, review time eats the gains.

## 4. The follow-up rule

Clock: **business days since the RM last sent or received something on this case.**

| Trigger | Action (all human-sent) |
| --- | --- |
| Day 0: RM sends the chase | Case marked "Awaiting client", deadline set |
| Client replies with something | Re-run the gap check. Update the gap list. Draft a "thanks, still outstanding" email for the RM. If the gap list is empty, close the loop |
| Day 3, no reply | Task to RM: "No reply in 3 days", with a pre-drafted reminder |
| Day 6, still no reply | Task to RM: suggest a phone call, with a short talking-points summary of the outstanding items |
| Day 9, still no reply | Flag to RM's manager or ops as "stalled"; nobody is auto-contacted |

**Edge rules**

- A **partial reply** restarts the 3-day count for the remaining items only.
- **Maximum one reminder task per case per day**, so RMs aren't flooded.
- The RM can **snooze or pause** a case (client on holiday, call agreed) with a reason.
- **Stop condition:** the checklist is satisfied, or the case is closed or withdrawn.

## 5. The measure

**Primary metric:** days from document request to documents received.

- **Start:** timestamp of the first chase email *sent* by the RM.
- **End:** timestamp when the last required item is received and passes the completeness check (present, in date, signed, all pages). This is not "judged genuine".
- Report **median and 75th percentile** per case type.

**Before vs after**

- **Baseline:** pull timestamps for roughly the last 50 closed cases. We already know the average (about 17 days, 3 rounds).
- **Backtest first (the FDE move):** run the gap-list logic on those historical cases as if at day 0. Compare what it finds up front with the gaps that were discovered in rounds 2 and 3. That gives an estimate before any client is touched.
- **Pilot:** a group of new cases, matched on case type, compared with the baseline. Note confounders such as case complexity and seasonality.
- **Target hypothesis:** median of 8 days or less (from about 17), with 2 rounds or fewer.

**Supporting metrics**

| Metric | Why |
| --- | --- |
| Chase rounds per case (3 to 1 or 2) | Directly measures "asked once" |
| First-pass gap recall: share of eventual gaps already in the day-0 list | Quality of the gap finder |
| Gap precision: share of listed gaps the RM kept | False alarms hurt trust |
| RM edit rate on drafts | Draft quality |
| RM minutes per chase | Efficiency |
| Client time-to-first-reply | Is the clearer email working? |

**Guardrails:** no rise in downstream rework or compliance rejections, and no rise in client complaints.

## 6. What we are NOT doing

- **No auto-send.** Every email is reviewed and sent by the RM.
- **No judging whether a document is genuine.** The tool checks presence, date, completeness and signature, nothing about forgery or authenticity.
- **No deciding whether a document is sufficient for risk or compliance purposes.** That stays with compliance. The tool applies the existing checklist and doesn't change it.
- **No inventing requirements.** If it isn't in the matrix, it isn't requested.
- **No contact outside the RM's channel.** No automatic calls, texts or messages to clients.
- **No threats or regulatory language** in client emails.
- **Not trying to fix the other 45 days of the cycle.** Scope is the document-chasing phase only.

## Open questions to confirm with Northgate

1. Is the requirements matrix written down and owned by someone, or is it tribal knowledge?
2. Are received documents already tagged with type, date and expiry, or does the tool need to read them?
3. Are deadlines client-facing commitments or internal targets?
4. Does the RM's mailbox allow drafts to be pre-filled, or is a separate review tool needed?

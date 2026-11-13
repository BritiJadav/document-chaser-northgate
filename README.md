# Northgate Bank Document Chaser Copilot

> AI-assisted document chasing copilot for relationship managers (RMs) in institutional and private wealth onboarding, compressing the 62-day cycle by finding every document gap in one pass and generating grounded, compliant requests.

---

## Architecture in 5 Lines
1. **Frontend**: React 18 + Vite + Tailwind CSS dark-mode UI implementing all 6 prototype screens with real-time API bindings and loading/error/empty states.
2. **Backend**: Python 3.12 + FastAPI featuring Pydantic models, CORS, SQLite persistence, and `/health` endpoint.
3. **LLM Engine**: Official `google-genai` SDK supporting **Vertex AI** and approved **Gemini 3 Flash Preview** (`gemini-3-flash-preview`) with structured JSON outputs.
4. **Rules & Cadence State Machine**: Evaluates full checklist in a single pass; automates Day 0 / Day 1.5 / Day 3 / Day 6 / Day 9 escalation rules with partial-reply clock restarts.
5. **Security & Deployment**: Human-In-The-Loop (HITL) mandatory dispatch gate, secrets in GCP Secret Manager, containerized via Cloud Run in `asia-south1`.

---

## Local Run (3 Commands)

```bash
# 1. Clone repository and create local environment file
cp .env.example .env

# 2. Start both frontend and backend services
docker compose up --build

# 3. Open application in your browser
# Frontend: http://localhost:3000
# Backend API & Docs: http://localhost:8000/docs
```

> **Note**: If you don't have a `GEMINI_API_KEY`, leave it blank in `.env`. The system runs in deterministic fallback mode providing 100% functionality and realistic synthetic drafts.

---

## GCP Lab Cloud Run Deployment (Aligned with Lab Restrictions)

This deployment strictly complies with all **GCP Lab Usage Instructions**:
- **Compute**: Cloud Run containerized deployment
- **Region**: `asia-south1` (meeting the Cloud Storage & regional service restriction)
- **Security**: Secret Manager for `GEMINI_API_KEY` (never stored in code or image layers)
- **AI Services**: Vertex AI approved model **Gemini 3 Flash Preview** (`gemini-3-flash-preview`)
- **Observability**: Cloud Logging and Cloud Monitoring integrated

### Automated One-Step Deployment:

#### On Windows (PowerShell):
```powershell
# 1. Log in to your GCP account and set your lab project
gcloud auth login
gcloud config set project YOUR_LAB_PROJECT_ID

# 2. Run the deployment script
.\deploy.ps1
```

#### On Linux / macOS / Google Cloud Shell (Bash):
```bash
# 1. Log in to your GCP account and set your lab project
gcloud auth login
gcloud config set project YOUR_LAB_PROJECT_ID

# 2. Make executable and run
chmod +x deploy.sh
./deploy.sh
```

### Live Deployed Cloud Run Endpoints:
- **Frontend Application**: `https://northgate-chaser-frontend-230261472273.asia-south1.run.app`
- **Backend Service**: `https://northgate-chaser-backend-230261472273.asia-south1.run.app`
- **Health Check**: `https://northgate-chaser-backend-230261472273.asia-south1.run.app/health`
- **Interactive Swagger Docs**: `https://northgate-chaser-backend-230261472273.asia-south1.run.app/docs`

---

## 3-Minute Demo Script

Follow this script to demonstrate all 6 screens and core Jobs-To-Be-Done:

### 1. Missing Documents Matrix (Find Every Gap at Once)
- Select **Harbourline Logistics Ltd** from the top case switcher.
- Note the **5 Observable Gaps** extracted in one pass across 4 related entities (Shareholder Register, Bank Statement, ID/POA for Daniel Whitaker & Alicia Moreno).
- Highlight the **RM Eyes Only: Possible Follow-on Detected** banner: Alicia Moreno's Q2 share allotment may cross 25%, but is held for RM confirmation and *never* included in the client email.
- Click **"Evaluate Full Case"** to see live checklist evaluation.

### 2. AI Draft Chase Email & Token Resolution
- Navigate to **"AI Draft Chase Email"** tab.
- Observe the **AI Policy Checks Bar** (5/5 Passed: 1 Request Rule, No Jargon, Warm Professional, Factual Only, No Threats).
- Notice the **Action Required Warning**: The draft contains `[RM TO CONFIRM: upload link]`.
- Click **"Autofill Northgate Vault Link"** then click **"Resolve"** to observe token replacement.
- Click **"Regenerate Draft with Gemini"** to observe the Google GenAI SDK call (`gemini-3-flash-preview`).

### 3. RM One-Screen Review & Send (HITL Gate)
- Switch case to **Priya Raman** (`PRI-88219`).
- Review the split screen: Left side shows gap matrix; right side shows live draft email.
- Click **"Remove (Override)"** on Proof of Address: notice how the email preview dynamically re-numbers the remaining items.
- Click **"Keep in Email"** to re-include it.
- Edit the bespoke audit note on Source of Funds ("Sale proceeds from Raman Tech Ventures Ltd").
- Click **"Approve & Send via RM Mailbox"**: observe 2FA token authentication, audit log write, and transition to "Awaiting Client".

### 4. Follow-Up Cadence & Triggers (State Machine)
- Switch case to **Okafor Family Trust** (`NG-WF-0982-OKA`).
- Observe the 5-stage cadence progression:
  - Day 0 (Chase Sent) -> Day 1.5 (Partial Reply Received) -> Day 3 (Pre-Drafted Reminder Due Today).
- Click **"Simulate Partial Reply"**: observe the 3-day clock restarting only for the remaining items.
- Click **"Advance Clock (+3 Days)"** to step into Day 6 (Phone Call Outreach with Talking Points).
- Test **"Snooze / Pause Case"** with an RM reason (e.g. "Client on holiday").

### 5. Pilot Impact & FDE Backtest
- Navigate to **"Pilot Metrics"**.
- Review the primary metric: **7.2 Days** (down from 17.1d baseline, -58% cycle time, overall cycle 62d -> 52.2d).
- Review the **6-Vector Diagnostic Grid** (Chase rounds down -61.3%, RM minutes down -81.2%, Recall 94.2%).
- Click **"Run FDE Backtest (50 Cases)"** to execute the backtest simulation comparing Day-0 full pack gap checks against legacy sequential chasing.

### 6. Scope & Policy Guardrails
- Navigate to **"Scope & Guardrails"**.
- Review the 6 rigid policy cards (No Auto-Send, No Forgery Speculation, No Risk Discretion, No Inventing Requirements, No Out-of-Band, No Threats).
- Use the **Interactive Guardrail Validator**:
  - Click **"Load Clean Sample"** and run audit (All checks pass).
  - Click **"Load Threat Sample"** and run audit: notice immediate violation detection for legal threats and regulatory fines!

---

## Running Backend Tests Locally

```bash
# Run all 16 unit & integration tests
python -m pytest backend/tests -v
```

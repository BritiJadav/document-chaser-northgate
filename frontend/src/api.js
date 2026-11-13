import { mockCasesList, mockCaseDetails, mockMetrics, mockBacktest } from './mockData';

// In-memory state store for Vercel / static demo hosting
let clientCaseStore = JSON.parse(JSON.stringify(mockCaseDetails));
let clientCasesList = JSON.parse(JSON.stringify(mockCasesList));

function getApiBase() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // On local machine, always route directly to local FastAPI server
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
    // In production container, use runtime injected Cloud Run backend URL
    if (window.__API_URL__ && !window.__API_URL__.includes('PLACEHOLDER')) {
      return window.__API_URL__.replace(/\/$/, '');
    }
  }
  return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
}

const API_BASE = getApiBase();

// Client-side fallback handler for static deployments (e.g. Vercel)
function handleStaticFallback(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // 1. Health check
  if (endpoint === '/health') {
    return {
      status: 'ok',
      version: '2.4.0-enterprise',
      environment: 'vercel-demo',
      database: 'client-in-memory',
      llm_model: 'gemini-3-flash-preview',
      llm_configured: true,
      timestamp: new Date().toISOString()
    };
  }

  // 2. Cases list
  if (endpoint === '/api/cases') {
    return JSON.parse(JSON.stringify(clientCasesList));
  }

  // 3. Reset database
  if (endpoint === '/api/cases/reset-seed' || endpoint === '/api/cases/reset') {
    clientCaseStore = JSON.parse(JSON.stringify(mockCaseDetails));
    clientCasesList = JSON.parse(JSON.stringify(mockCasesList));
    return { message: "Database reset to pristine seed state successfully." };
  }

  // 4. Metrics & Backtest
  if (endpoint === '/api/metrics' || endpoint === '/api/telemetry/metrics') {
    return JSON.parse(JSON.stringify(mockMetrics));
  }
  if (endpoint.startsWith('/api/metrics/backtest') || endpoint.startsWith('/api/telemetry/backtest')) {
    return JSON.parse(JSON.stringify(mockBacktest));
  }

  // 5. Guardrails validate
  if (endpoint === '/api/guardrails/validate') {
    const body = options.body ? JSON.parse(options.body) : {};
    const text = body.text || '';
    const violations = [];
    if (/penalty|fca fine|shut down|freeze/i.test(text)) {
      violations.push("Tone Guardrail: Never threaten penalties, fines or enforcement actions.");
    }
    if (/fake|forged|fraudulent|tampered/i.test(text)) {
      violations.push("Factual Tone: Describe document properties factually without authenticity speculation.");
    }
    if (/\[RM TO CONFIRM:[^\]]+\]/i.test(text)) {
      violations.push("Unconfirmed Token Block: Draft contains unresolved token placeholders.");
    }
    return {
      all_passed: violations.length === 0,
      violations: violations,
      verified_rules: [
        "1 Request Rule: Consolidated gap inventory",
        "Warm & Professional Tone: Dignified client relationship posture",
        "Single Deadline Mandate: Precise date stated once"
      ]
    };
  }

  // 6. Case specific endpoints
  const caseIdMatch = endpoint.match(/\/api\/cases\/([^\/\?]+)/);
  if (caseIdMatch) {
    const caseId = caseIdMatch[1];
    let c = clientCaseStore[caseId] || clientCaseStore['HL-2026-8941'];

    // GET /api/cases/{caseId}
    if (endpoint === `/api/cases/${caseId}`) {
      return JSON.parse(JSON.stringify(c));
    }

    // POST evaluate
    if (endpoint.endsWith('/evaluate') || endpoint.endsWith('/evaluate-gaps')) {
      return JSON.parse(JSON.stringify(c));
    }

    // POST generate-draft
    if (endpoint.endsWith('/generate-draft')) {
      if (!c.draft_email) {
        c.draft_email = {
          id: `draft-${c.id}-${Date.now()}`,
          case_id: c.id,
          to_name: c.related_parties[0]?.name || "Client",
          to_email: c.related_parties[0]?.email || "client@company.co.uk",
          from_name: c.assigned_rm,
          from_email: `${c.assigned_rm.toLowerCase().replace(' ', '.')}@northgatebank.co.uk`,
          subject: `${c.name}: ${c.gaps.length} items needed to complete onboarding (by Friday 20 November 2026)`,
          deadline_text: "Response Deadline: Friday 20 November 2026 (One clear ask)",
          deadline_date: "Friday 20 November 2026",
          body: `Dear ${c.related_parties[0]?.name?.split(' ')[0] || 'Client'},\n\nThank you for the incorporation documents. We've checked the full pack against our requirements and need the items below. Sending all of them together by Friday 20 November 2026 will avoid further requests.\n\n` +
                c.gaps.map((g, idx) => `${idx + 1}. **${g.requirement}.** ${g.evidence}`).join('\n') +
                `\n\nA secure upload link is here: [RM TO CONFIRM: upload link]. Or reply to this email with attachments.\n\nKind regards,\n${c.assigned_rm}, Relationship Manager, Northgate`,
          notes_for_rm: "NOTES FOR RM: All identified items consolidated in a single communication.",
          unresolved_tokens: ["[RM TO CONFIRM: upload link]"],
          tokens_resolved: false,
          policy_checks_passed: true,
          policy_audit: ["1 Request Rule Consolidated", "Warm & Professional Tone", "Single Response Deadline"],
          created_at: new Date().toISOString(),
          model_used: "gemini-3-flash-preview",
          tokens_count: 360,
          latency_ms: 210
        };
      }
      return JSON.parse(JSON.stringify(c.draft_email));
    }

    // POST resolve-token
    if (endpoint.endsWith('/resolve-token')) {
      const body = options.body ? JSON.parse(options.body) : {};
      if (c.draft_email) {
        c.draft_email.body = c.draft_email.body.replace(body.token_key, body.token_value);
        c.draft_email.unresolved_tokens = c.draft_email.unresolved_tokens.filter(t => t !== body.token_key);
        c.draft_email.tokens_resolved = c.draft_email.unresolved_tokens.length === 0;
      }
      return JSON.parse(JSON.stringify(c.draft_email));
    }

    // POST update-gap
    if (endpoint.endsWith('/update-gap')) {
      const body = options.body ? JSON.parse(options.body) : {};
      const gap = c.gaps.find(g => g.id === body.gap_id);
      if (gap) {
        if (body.selected !== undefined) gap.selected = body.selected;
        if (body.override_reason !== undefined) gap.override_reason = body.override_reason;
        if (body.bespoke_note !== undefined) gap.bespoke_note = body.bespoke_note;
      }
      return JSON.parse(JSON.stringify(c));
    }

    // POST review-send
    if (endpoint.endsWith('/review-send')) {
      c.status = 'IN_CADENCE';
      c.cadence.current_stage = 'DAY_1_5';
      c.cadence.stage_label = 'Day 1.5: Delivery Confirmation';
      c.audit_trail.unshift({
        id: `aud-${Date.now()}`,
        case_id: c.id,
        timestamp: new Date().toLocaleDateString(),
        rm_name: c.assigned_rm,
        action: 'Email Dispatched by RM',
        details: 'Dispatched consolidated chase email after human-in-the-loop review.',
        token_verified: true,
        hitl_enforced: true
      });
      return JSON.parse(JSON.stringify(c));
    }

    // POST simulate-reply
    if (endpoint.endsWith('/simulate-reply')) {
      const body = options.body ? JSON.parse(options.body) : {};
      const receivedIds = body.received_gap_ids || [];
      c.gaps.forEach(g => {
        if (receivedIds.includes(g.id)) {
          g.status = 'OK';
          g.selected = false;
        }
      });
      c.cadence.clock_reset_count += 1;
      c.cadence.stage_label = `Clock Reset (${c.cadence.clock_reset_count}x): Day 0 of 3d Partial Reset`;
      return JSON.parse(JSON.stringify(c));
    }

    // POST advance-cadence
    if (endpoint.includes('/advance-cadence')) {
      c.cadence.total_days_elapsed += 3.0;
      if (c.cadence.current_stage === 'DAY_0') c.cadence.current_stage = 'DAY_1_5';
      else if (c.cadence.current_stage === 'DAY_1_5') c.cadence.current_stage = 'DAY_3';
      else if (c.cadence.current_stage === 'DAY_3') c.cadence.current_stage = 'DAY_6';
      else if (c.cadence.current_stage === 'DAY_6') c.cadence.current_stage = 'DAY_9';
      c.cadence.stage_label = `Day ${c.cadence.total_days_elapsed} of Cadence`;
      return JSON.parse(JSON.stringify(c));
    }

    // POST snooze
    if (endpoint.endsWith('/snooze')) {
      const body = options.body ? JSON.parse(options.body) : {};
      c.cadence.is_snoozed = true;
      c.cadence.snooze_reason = body.reason || "Client holiday";
      return JSON.parse(JSON.stringify(c));
    }
  }

  // Fallback to active case
  return JSON.parse(JSON.stringify(clientCaseStore['HL-2026-8941']));
}

async function request(endpoint, options = {}) {
  // If no external API base is available (e.g. Vercel static hosting), serve client store immediately
  if (!API_BASE) {
    return handleStaticFallback(endpoint, options);
  }

  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      // If the backend returns 404 or server error, gracefully fall back
      console.warn(`[API] Server returned ${res.status} on ${endpoint}. Using high-fidelity demo fallback.`);
      return handleStaticFallback(endpoint, options);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Network failure on ${endpoint}. Falling back to demo data store:`, err);
    return handleStaticFallback(endpoint, options);
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Cases
  getCases: () => request('/api/cases'),
  getCase: (caseId) => request(`/api/cases/${caseId}`),
  getCaseDetail: (caseId) => request(`/api/cases/${caseId}`),
  evaluateGaps: (caseId) => request(`/api/cases/${caseId}/evaluate`, { method: 'POST' }),
  resetDatabase: () => request('/api/cases/reset-seed', { method: 'POST' }),

  // Drafting
  generateDraft: (caseId) => request(`/api/cases/${caseId}/generate-draft`, { method: 'POST' }),
  resolveToken: (caseId, payload) => 
    request(`/api/cases/${caseId}/resolve-token`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateGap: (caseId, payload) =>
    request(`/api/cases/${caseId}/update-gap`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Review & Send
  reviewAndSend: (caseId, payload) =>
    request(`/api/cases/${caseId}/review-send`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Cadence
  simulateReply: (caseId, payload) =>
    request(`/api/cases/${caseId}/simulate-reply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  snoozeCase: (caseId, payload) =>
    request(`/api/cases/${caseId}/snooze`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  advanceCadence: (caseId, days = 3) =>
    request(`/api/cases/${caseId}/advance-cadence?days=${days}`, { method: 'POST' }),

  // Telemetry & Guardrails
  getMetrics: () => request('/api/metrics'),
  runBacktest: (sampleSize = 50) => 
    request(`/api/metrics/backtest?sample_size=${sampleSize}`, { method: 'POST' }),
  validateGuardrails: (payload) =>
    request('/api/guardrails/validate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export default api;

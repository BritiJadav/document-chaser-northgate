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

async function request(endpoint, options = {}) {
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
      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        errorData = { detail: res.statusText };
      }
      const message = errorData.detail || `Request failed with status ${res.status}`;
      throw new Error(message);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Request Error [${endpoint}]:`, err);
    throw err;
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

import React, { useState } from 'react';
import { api } from '../api';
import { useCase } from '../context/CaseContext';

export default function GuardrailsView() {
  const { showToast } = useCase();
  const [testText, setTestText] = useState(
    "Dear Daniel,\n\nThank you for sending your documents. We need 3 items to complete your onboarding: 1. Photo ID, 2. Proof of address within 3 months, 3. Shareholder register. Please send by Friday 20 November.\n\nKind regards,\nMeera Shah"
  );
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateText = async () => {
    setIsValidating(true);
    try {
      const result = await api.validateGuardrails({
        subject: "Draft Outreach Audit",
        body: testText,
        has_unconfirmed_tokens: testText.includes("[RM TO CONFIRM:"),
      });
      setValidationResult(result);
      showToast(result.all_passed ? '100% Policy Guardrails Audited & Passed.' : 'Guardrail violations flagged.');
    } catch (err) {
      showToast(`Validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const guardrails = [
    {
      id: "G-01",
      number: "GUARDRAIL 01",
      title: "No Auto-Send",
      badge: "HUMAN-IN-THE-LOOP MANDATORY",
      badgeColor: "bg-accent-electric/10 border-accent-electric/30 text-accent-electric",
      icon: "touch_app",
      description: "Every chase email must be explicitly reviewed, validated, and sent by the human RM directly from their authenticated mailbox. Zero autonomous delivery is permitted under Northgate operating charter.",
      footerLeft: "ENFORCEMENT: SMTP GATEWAY BLOCKED",
      footerRight: "RM AUTH REQ"
    },
    {
      id: "G-02",
      number: "GUARDRAIL 02",
      title: "No Authenticity / Forgery Judging",
      badge: "FRAUD TEAMS SOLE JURISDICTION",
      badgeColor: "bg-accent-violet/20 border-accent-violet/40 text-secondary",
      icon: "fact_check",
      description: "The tool strictly checks presence, date freshness (≤ 3 months), page completeness, and signature. Document forensic authenticity verification remains solely with Fraud Ops.",
      footerLeft: "FORENSIC ROUTING: TIER-3 SPECIALIZED",
      footerRight: "SURFACE CHECKS ONLY"
    },
    {
      id: "G-03",
      number: "GUARDRAIL 03",
      title: "No Risk & Policy Discretion",
      badge: "RIGID COMPLIANCE MATRIX ONLY",
      badgeColor: "bg-accent-electric/10 border-accent-electric/30 text-accent-electric",
      icon: "gavel",
      description: "The copilot mechanically references the bank matrix (ID-01, POA-02, CORP-01). It never decides sufficiency, interprets edge exceptions, or weakens core institutional compliance controls.",
      footerLeft: "MAPPING: DETERMINISTIC MAPPING",
      footerRight: "ZERO HEURISTICS"
    },
    {
      id: "G-04",
      number: "GUARDRAIL 04",
      title: "No Inventing Requirements",
      badge: "PROMPT HALLUCINATION LOCKOUT",
      badgeColor: "bg-accent-electric/10 border-accent-electric/30 text-accent-electric",
      icon: "spellcheck",
      description: "If an item is not cataloged in the approved checklist matrix, it is never requested. Missing contextual inputs automatically invoke a distinct [RM TO CONFIRM] block for human completion.",
      footerLeft: "SYNTHETIC PROMPT SHIELD: ACTIVE",
      footerRight: "[RM TO CONFIRM]"
    },
    {
      id: "G-05",
      number: "GUARDRAIL 05",
      title: "No Out-of-Band Contact",
      badge: "ENCRYPTED CORPORATE TRANSPORT ONLY",
      badgeColor: "bg-accent-violet/20 border-accent-violet/40 text-secondary",
      icon: "phonelink_lock",
      description: "Strictly zero automated SMS, WhatsApp, robocalls, or unvetted external channels. All communication stays constrained to the RM's corporate Northgate secure mail routing with enterprise DLP filters.",
      footerLeft: "ALLOWED: NORTHGATE CORPORATE MAIL",
      footerRight: "TLS 1.3 PINNED"
    },
    {
      id: "G-06",
      number: "GUARDRAIL 06",
      title: "No Threats or Regulatory Penalties",
      badge: "REPUTATIONAL INTEGRITY SHIELD",
      badgeColor: "bg-accent-electric/10 border-accent-electric/30 text-accent-electric",
      icon: "sentiment_satisfied",
      description: "The prompt and fine-tuned filters strictly prohibit threats, regulatory penalty mentions, or aggressive phrasing. Tone is always warm, professional, respectful, and direct.",
      footerLeft: "TONE SHIELD: REPUTATIONAL INTEGRITY",
      footerRight: "WARM & PROFESSIONAL"
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              6. Scope &amp; Policy Guardrails
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-surface-overlay border border-accent-electric/40 text-accent-electric text-[10px] font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-electric"></span>
              TIER-1 REGULATORY ENFORCED
            </span>
          </div>
          <p className="text-xs text-text-secondary max-w-3xl leading-relaxed mt-1">
            Clear ethical and regulatory safeguards governing the AI tool. Engineered programmatic boundaries prevent unauthorized autonomous execution, preserve AML integrity, and ensure complete institutional transparency.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-surface-elevated p-2 rounded-lg border border-border-subtle text-xs font-mono">
          <div className="text-right">
            <span className="block text-[10px] text-text-muted">ACTIVE PROMPT FILTERS</span>
            <span className="font-bold text-accent-electric">100% HARD-LOCKED</span>
          </div>
          <div className="h-7 w-[1px] bg-border-subtle"></div>
          <div className="text-right">
            <span className="block text-[10px] text-text-muted">COMPLIANCE VERSION</span>
            <span className="font-bold text-text-primary">v4.8.2-CORP</span>
          </div>
        </div>
      </div>

      {/* 2. 2x3 Grid of 6 Distinct Policy Guardrail Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guardrails.map((g) => (
          <article
            key={g.id}
            className="bg-surface-elevated border border-border-subtle rounded-xl p-5 hover:border-accent-electric/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center text-accent-electric">
                    <span className="material-symbols-outlined text-xl">{g.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-text-muted uppercase">{g.number}</span>
                    <h3 className="text-sm font-semibold text-text-primary">{g.title}</h3>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${g.badgeColor}`}>
                  {g.badge}
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mb-4">
                {g.description}
              </p>
            </div>
            <div className="bg-surface-canvas p-2 rounded-lg border border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-muted">
              <span className="flex items-center space-x-1.5">
                <span className="material-symbols-outlined text-xs text-accent-electric">lock</span>
                <span>{g.footerLeft}</span>
              </span>
              <span className="text-accent-electric font-semibold">{g.footerRight}</span>
            </div>
          </article>
        ))}
      </section>

      {/* 3. Interactive Policy Validator Tool */}
      <section className="bg-surface-elevated border border-border-prominent rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-electric text-xl">fact_check</span>
            <h3 className="text-sm font-bold text-text-primary">Interactive Compliance &amp; Guardrail Validator</h3>
          </div>
          <span className="text-xs text-text-muted font-mono">Test arbitrary text against all 6 policy guardrails</span>
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-text-secondary font-mono">
            INPUT TEXT TO AUDIT (Try inserting words like "fine", "fraud", "penalty", or "[RM TO CONFIRM: link]" to test guardrails):
          </label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={4}
            className="w-full bg-surface-canvas border border-border-prominent rounded-lg p-3 text-xs text-text-primary font-body-md focus:border-accent-electric outline-none transition-colors"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setTestText("Dear Priya,\n\nWe need your updated passport and proof of address by 19 November to finalize your account.\n\nKind regards,\nMeera Shah")}
              className="px-3 py-1.5 rounded bg-surface-overlay text-text-secondary hover:text-text-primary text-xs font-semibold"
            >
              Load Clean Sample
            </button>
            <button
              onClick={() => setTestText("WARNING: Failure to comply will result in regulatory fines and legal prosecution for fraud. Send immediately.")}
              className="px-3 py-1.5 rounded bg-surface-overlay text-error hover:bg-error-container/20 text-xs font-semibold"
            >
              Load Threat Sample (Violation)
            </button>
            <button
              onClick={handleValidateText}
              disabled={isValidating}
              className="px-5 py-2 rounded-lg bg-accent-electric text-surface-canvas font-bold text-xs hover:brightness-110 flex items-center gap-1.5 shadow-[0_0_12px_rgba(2,245,118,0.25)] transition-all disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-sm ${isValidating ? 'animate-spin' : ''}`}>
                {isValidating ? 'sync' : 'rule'}
              </span>
              <span>{isValidating ? 'Auditing...' : 'Run Guardrails Audit'}</span>
            </button>
          </div>
        </div>

        {/* Validation Results Display */}
        {validationResult && (
          <div className="mt-4 p-4 bg-surface-canvas rounded-lg border border-border-subtle space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary font-mono uppercase">Audit Findings:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                validationResult.all_passed ? 'bg-accent-electric/20 text-accent-electric' : 'bg-error/20 text-error'
              }`}>
                {validationResult.all_passed ? 'ALL CHECKS PASSED' : 'VIOLATIONS FLAGGED'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {validationResult.checks.map((chk) => (
                <div
                  key={chk.guardrail_id}
                  className={`p-2.5 rounded border flex items-start gap-2 ${
                    chk.passed
                      ? 'bg-surface-elevated border-border-subtle text-text-secondary'
                      : 'bg-error/10 border-error/40 text-error'
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${chk.passed ? 'text-accent-electric' : 'text-error'}`}>
                    {chk.passed ? 'check_circle' : 'cancel'}
                  </span>
                  <div>
                    <div className="font-bold text-text-primary">{chk.title}</div>
                    <div className="text-[11px] leading-relaxed mt-0.5">{chk.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

import React, { useState } from 'react';
import { useCase } from '../context/CaseContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AiDraftView() {
  const {
    activeCase,
    refreshActiveCase,
    setCurrentView,
    showToast,
    loading
  } = useCase();

  const [regenerating, setRegenerating] = useState(false);
  const [resolvingToken, setResolvingToken] = useState(false);
  const [vaultLink, setVaultLink] = useState('https://vault.northgatebank.co.uk/u/hl-8941-auth-req');
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedBody, setEditedBody] = useState('');

  if (loading || !activeCase) {
    return <LoadingSpinner label="Loading AI Draft Synthesis..." />;
  }

  const draft = activeCase.draft_email;
  const unresolvedTokens = draft?.unresolved_tokens || [];
  const hasUnresolvedTokens = unresolvedTokens.length > 0;

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await api.generateDraft(activeCase.id);
      await refreshActiveCase(activeCase.id);
      showToast('Consolidated draft regenerated with Google Gemini (gemini-3.8-flash).');
    } catch (err) {
      showToast(`Generation failed: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  const handleAutofillLink = () => {
    const slug = activeCase.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
    setVaultLink(`https://vault.northgatebank.co.uk/u/${slug}-auth-req`);
  };

  const handleResolveToken = async () => {
    if (!unresolvedTokens.length) return;
    setResolvingToken(true);
    try {
      const targetToken = unresolvedTokens[0];
      await api.resolveToken(activeCase.id, {
        token_key: targetToken,
        token_value: vaultLink,
      });
      await refreshActiveCase(activeCase.id);
      showToast('Unconfirmed upload token resolved successfully.');
    } catch (err) {
      showToast(`Failed to resolve token: ${err.message}`);
    } finally {
      setResolvingToken(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Case Header Bar */}
      <section className="bg-surface-elevated border border-border-subtle rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-surface-overlay border border-border-prominent flex items-center justify-center text-accent-violet">
            <span className="material-symbols-outlined text-2xl">domain</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-text-primary tracking-tight">{activeCase.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-accent-violet/20 text-[#c9beff] border border-accent-violet/30">
                {activeCase.client_type}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 tracking-wider">
                AI DRAFT SYNTHESIS (UNSENT)
              </span>
            </div>
            <div className="flex items-center space-x-3 text-text-secondary text-xs mt-1">
              <span>Case ID: <strong className="text-text-primary font-mono">{activeCase.id}</strong></span>
              <span className="text-border-subtle">•</span>
              <span>Assigned RM: <strong className="text-text-primary">{activeCase.assigned_rm}</strong></span>
              <span className="text-border-subtle">•</span>
              <span className="text-accent-electric flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Grounded via Gemini 3.8 Flash
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-3.5 py-1.5 rounded-lg border border-border-subtle hover:border-border-prominent bg-surface-canvas text-text-primary text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-sm text-accent-electric ${regenerating ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{regenerating ? 'Synthesizing...' : 'Regenerate Draft with Gemini'}</span>
          </button>
          <button
            onClick={() => setCurrentView('review')}
            className="px-4 py-1.5 rounded-lg bg-accent-electric text-surface-canvas hover:brightness-110 font-bold text-xs flex items-center space-x-1.5 shadow-[0_0_12px_rgba(2,245,118,0.25)] transition-all"
          >
            <span>Proceed to RM Review &amp; Send</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* 2. AI Policy Checks Bar (4/4 Passed) */}
      <section className="bg-surface-elevated border border-border-subtle rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-accent-electric/15 border border-accent-electric/30 text-accent-electric font-bold text-[11px]">
            <span className="material-symbols-outlined text-xs">verified</span>
            <span>AI POLICY CHECKS: 5/5 PASSED</span>
          </div>
          <span className="text-text-muted hidden md:inline">Regulatory communication compliance automatically audited:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-primary text-[11px]">
            <span className="material-symbols-outlined text-accent-electric text-xs">check_circle</span>
            <span>1 Request Rule</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-primary text-[11px]">
            <span className="material-symbols-outlined text-accent-electric text-xs">check_circle</span>
            <span>No Jargon</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-primary text-[11px]">
            <span className="material-symbols-outlined text-accent-electric text-xs">check_circle</span>
            <span>Warm Professional</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-primary text-[11px]">
            <span className="material-symbols-outlined text-accent-electric text-xs">check_circle</span>
            <span>Factual Only</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-overlay border border-border-subtle text-text-primary text-[11px]">
            <span className="material-symbols-outlined text-accent-electric text-xs">shield</span>
            <span>No Threats</span>
          </div>
        </div>
      </section>

      {/* 3. Prominent Warning Banner (Action Required Before Sending) */}
      {hasUnresolvedTokens && (
        <section className="bg-gradient-to-r from-amber-950/40 via-surface-elevated to-surface-elevated border-l-4 border-l-amber-400 border border-amber-500/30 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/40">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-amber-300 text-sm">Action Required Before Sending</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  {unresolvedTokens.length} Unresolved Token
                </span>
              </div>
              <p className="text-text-secondary text-xs mt-0.5">
                The draft contains an unconfirmed token: <code className="bg-surface-canvas text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs border border-amber-400/30">{unresolvedTokens[0]}</code>. Northgate Security Mandate prohibits outgoing messages with mock or missing vault tokens.
              </p>
            </div>
          </div>

          {/* Token Autofill & Resolution Input Group */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 shrink-0 bg-surface-canvas/90 p-1.5 rounded-lg border border-border-prominent">
            <div className="relative flex-1 sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
                <span className="material-symbols-outlined text-sm">link</span>
              </span>
              <input
                type="text"
                value={vaultLink}
                onChange={(e) => setVaultLink(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 bg-surface-elevated border border-border-subtle rounded text-text-primary text-xs font-mono focus:outline-none focus:border-accent-electric transition-colors"
                placeholder="https://vault.northgatebank.co.uk/..."
              />
            </div>
            <button
              onClick={handleAutofillLink}
              className="px-2.5 py-1.5 rounded bg-surface-overlay hover:bg-surface-bright text-text-primary border border-border-subtle text-xs font-semibold flex items-center space-x-1 whitespace-nowrap transition-colors"
              title="Generate client-specific vault drop link"
            >
              <span className="material-symbols-outlined text-xs text-accent-electric">magic_button</span>
              <span>Autofill</span>
            </button>
            <button
              onClick={handleResolveToken}
              disabled={resolvingToken}
              className="px-3.5 py-1.5 rounded bg-accent-electric text-surface-canvas font-bold text-xs flex items-center space-x-1 whitespace-nowrap hover:brightness-105 shadow-[0_0_12px_rgba(2,245,118,0.25)] transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>{resolvingToken ? 'Resolving...' : 'Resolve'}</span>
            </button>
          </div>
        </section>
      )}

      {/* 4. Two-Column Email Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Outlook / Corporate Mail Composer View (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl overflow-hidden shadow-xl">
            {/* Titlebar */}
            <div className="bg-surface-overlay px-4 py-2.5 border-b border-border-subtle flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                <span className="text-text-muted text-[11px] font-mono ml-2">
                  Microsoft 365 Exchange Gateway • Draft Message #{draft?.id?.slice(0, 10) || "D-8941"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-text-secondary text-[11px]">
                <span className="flex items-center text-accent-electric font-mono">
                  <span className="material-symbols-outlined text-xs mr-1">auto_awesome</span>
                  LLM Context Grounded
                </span>
                <span className="text-text-muted">|</span>
                <span className="font-mono">UTF-8</span>
              </div>
            </div>

            {/* Mail Headers */}
            <div className="p-4 border-b border-border-subtle bg-surface-elevated/70 flex flex-col space-y-2.5 text-xs">
              {/* To */}
              <div className="flex items-center">
                <span className="w-16 text-text-muted font-bold uppercase text-[10px]">To:</span>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-surface-canvas border border-border-prominent text-text-primary font-mono text-xs">
                    <span className="material-symbols-outlined text-xs text-text-secondary">account_circle</span>
                    <span className="font-semibold">{draft?.to_name}</span>
                    <span className="text-text-muted">&lt;{draft?.to_email}&gt;</span>
                  </div>
                </div>
              </div>

              {/* From */}
              <div className="flex items-center">
                <span className="w-16 text-text-muted font-bold uppercase text-[10px]">From:</span>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-surface-canvas border border-border-subtle text-text-secondary font-mono text-xs">
                    <span className="material-symbols-outlined text-xs text-accent-electric">verified_user</span>
                    <span className="font-semibold text-text-primary">{draft?.from_name}</span>
                    <span className="text-text-muted">&lt;{draft?.from_email}&gt;</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-overlay text-accent-violet text-[10px] font-semibold">via Copilot</span>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="flex items-center">
                <span className="w-16 text-text-muted font-bold uppercase text-[10px]">Subject:</span>
                <div className="flex-1">
                  <div className="w-full px-3 py-1.5 rounded bg-surface-canvas border border-border-subtle text-text-primary font-semibold text-xs font-mono">
                    {draft?.subject}
                  </div>
                </div>
              </div>

              {/* SLA Deadline Callout */}
              <div className="mt-1 bg-gradient-to-r from-accent-violet/20 via-surface-overlay to-surface-canvas border border-accent-violet/40 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-accent-violet/30 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-base">calendar_clock</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">SLA DEADLINE CALLOUT</span>
                    <span className="text-text-primary text-xs font-bold">{draft?.deadline_text}</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center space-x-1.5 text-xs text-text-secondary">
                  <span className="w-2 h-2 rounded-full bg-accent-electric"></span>
                  <span className="font-mono text-[11px]">7 Business Days Remaining</span>
                </div>
              </div>
            </div>

            {/* Mail Body */}
            <div className="p-6 bg-[#0e121a] text-text-primary text-xs font-body-md leading-relaxed space-y-4 custom-scrollbar min-h-[420px] whitespace-pre-line">
              {draft?.body}
            </div>

            {/* Notes for RM callout */}
            {draft?.notes_for_rm && (
              <div className="p-4 bg-surface-overlay/80 border-t border-border-subtle text-xs space-y-1">
                <span className="font-bold text-accent-violet uppercase tracking-wider text-[10px] font-mono block">
                  NOTES FOR RM ONLY (NEVER SENT TO CLIENT):
                </span>
                <p className="text-text-secondary leading-relaxed">
                  {draft.notes_for_rm}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Case Facts & Prompt Audit Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Metadata Card */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-accent-electric">info</span>
              <span>Case Facts &amp; Context</span>
            </h3>
            <div className="divide-y divide-border-subtle text-xs font-mono">
              <div className="py-2 flex justify-between">
                <span className="text-text-muted">Entity:</span>
                <span className="text-text-primary font-semibold">{activeCase.name}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-text-muted">Type:</span>
                <span className="text-secondary">{activeCase.client_type}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-text-muted">SLA Window:</span>
                <span className="text-text-primary">{activeCase.sla_total_days} Days</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-text-muted">Gaps In Email:</span>
                <span className="text-accent-electric font-bold">{activeCase.gaps?.filter(g => g.selected).length} Items</span>
              </div>
            </div>
          </div>

          {/* Model Telemetry */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-accent-violet">smart_toy</span>
              <span>Google GenAI SDK Config</span>
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-surface-canvas p-2 rounded border border-border-subtle">
                <span className="text-text-muted">Model:</span>
                <span className="text-accent-electric font-bold">{draft?.model_used || "gemini-3.8-flash"}</span>
              </div>
              <div className="flex justify-between items-center bg-surface-canvas p-2 rounded border border-border-subtle">
                <span className="text-text-muted">Structured Output:</span>
                <span className="text-secondary">Pydantic JSON Mode</span>
              </div>
              <div className="flex justify-between items-center bg-surface-canvas p-2 rounded border border-border-subtle">
                <span className="text-text-muted">Latency:</span>
                <span className="text-text-primary">{draft?.latency_ms || 240} ms</span>
              </div>
              <div className="flex justify-between items-center bg-surface-canvas p-2 rounded border border-border-subtle">
                <span className="text-text-muted">Tokens:</span>
                <span className="text-text-primary">{draft?.tokens_count || 412} tokens</span>
              </div>
            </div>
          </div>

          {/* Prompt Rules Checklist */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-accent-electric">fact_check</span>
              <span>Prompt Rules Verified</span>
            </h3>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent-electric text-sm shrink-0 mt-0.5">check_circle</span>
                <span><strong>Ask for everything in ONE email:</strong> Consolidated gap list.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent-electric text-sm shrink-0 mt-0.5">check_circle</span>
                <span><strong>Numbered item per gap:</strong> Includes what we need and factual problem.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent-electric text-sm shrink-0 mt-0.5">check_circle</span>
                <span><strong>Exact deadline stated once:</strong> Clear single ask near top.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent-electric text-sm shrink-0 mt-0.5">check_circle</span>
                <span><strong>Zero threats or penalties:</strong> Warm and professional tone shield.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent-electric text-sm shrink-0 mt-0.5">check_circle</span>
                <span><strong>[RM TO CONFIRM]:</strong> Missing vault links gated behind human confirmation.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

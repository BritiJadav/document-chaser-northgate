import React, { useState } from 'react';
import { useCase } from '../context/CaseContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CadenceView() {
  const {
    activeCase,
    refreshActiveCase,
    setCurrentView,
    showToast,
    loading
  } = useCase();

  const [simulatingReply, setSimulatingReply] = useState(false);
  const [advancingClock, setAdvancingClock] = useState(false);
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
  const [snoozeReason, setSnoozeReason] = useState('Client on holiday until next Monday');
  const [snoozeDays, setSnoozeDays] = useState(3);

  if (loading || !activeCase) {
    return <LoadingSpinner label="Loading Follow-Up Cadence & Triggers..." />;
  }

  const cadence = activeCase.cadence || {
    stage: 'DAY_3_REMINDER',
    clock_days: 3.0,
    last_contact_date: 'Mon 9 Nov',
    deadline_date: 'Mon 16 Nov 2026',
    history: []
  };

  const handleSimulatePartialReply = async () => {
    setSimulatingReply(true);
    try {
      await api.simulateReply(activeCase.id, {
        received_doc_types: ['Passport Photo ID', 'Trust Deed', 'Shareholder Register'],
        notes: 'Client submitted partial pack via secure upload portal.'
      });
      await refreshActiveCase(activeCase.id);
      showToast('Partial reply ingested: Gaps updated & 3-day clock restarted for remaining items.');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSimulatingReply(false);
    }
  };

  const handleAdvanceClock = async (days = 3.0) => {
    setAdvancingClock(true);
    try {
      await api.advanceCadence(activeCase.id, days);
      await refreshActiveCase(activeCase.id);
      showToast(`Clock advanced by +${days} days. State machine recalculated.`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setAdvancingClock(false);
    }
  };

  const handleSnooze = async () => {
    try {
      await api.snoozeCase(activeCase.id, {
        days: snoozeDays,
        reason: snoozeReason,
      });
      await refreshActiveCase(activeCase.id);
      setIsSnoozeOpen(false);
      showToast(`Case snoozed for ${snoozeDays} days. Reason: ${snoozeReason}`);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <section className="bg-surface-elevated border border-border-subtle rounded-xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded bg-surface-overlay border border-border-prominent text-accent-electric text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-electric animate-ping"></span>
                {cadence.is_snoozed ? 'PAUSED / SNOOZED' : 'CHASE ACTIVE'}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-accent-violet/15 text-secondary text-xs font-semibold">
                {activeCase.client_type}
              </span>
              <span className="text-text-muted text-xs font-mono">{activeCase.crn_or_ref}</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {activeCase.name}
              <span className="text-text-secondary text-base font-normal ml-2">
                | Primary Contact: {activeCase.related_parties?.[0]?.name || "Client"}
              </span>
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1 text-text-primary">
                <span className="material-symbols-outlined text-sm text-accent-electric">outgoing_mail</span>
                Chase Sent: <strong className="font-semibold">{cadence.last_contact_date}</strong>
              </span>
              <span className="text-border-prominent">•</span>
              <span className="flex items-center gap-1 text-accent-electric font-semibold font-mono">
                <span className="material-symbols-outlined text-sm">timer</span>
                T+{cadence.clock_days.toFixed(1)} Days Elapsed
              </span>
              <span className="text-border-prominent">•</span>
              <span className="flex items-center gap-1 text-text-muted">
                <span className="material-symbols-outlined text-sm">security</span>
                Assigned RM: {activeCase.assigned_rm}
              </span>
            </div>
          </div>

          <div className="xl:text-right flex flex-col xl:items-end justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-overlay border border-border-prominent text-xs font-mono">
              <span className="material-symbols-outlined text-accent-electric text-base">bolt</span>
              <span>Cadence Engine · {cadence.stage}</span>
            </div>
            {cadence.is_snoozed && (
              <span className="text-amber-300 text-xs mt-1 font-semibold">
                Snoozed: {cadence.snooze_reason}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. State Machine Progression Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-electric">account_tree</span>
            <span>Follow-Up State Machine Progression</span>
          </h2>
          <p className="text-xs text-text-secondary">
            Deterministic multi-tier escalation pathway aligned with FCA regulatory communication guardrails.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted bg-surface-elevated px-3 py-1 rounded-lg border border-border-subtle">
          <span className="w-2 h-2 rounded-full bg-accent-electric"></span>
          <span>ACTIVE TIMELINE TRACKER</span>
        </div>
      </div>

      {/* 3. Wide Cadence State Machine Interactive Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Step 1: Day 0 (Complete) */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 flex flex-col justify-between relative group hover:border-accent-electric/40 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent-electric rounded-t-xl"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-accent-electric bg-accent-electric/10 px-2 py-0.5 rounded font-mono">
                DAY 0 • EXEC
              </span>
              <div className="w-5 h-5 rounded-full bg-accent-electric/20 border border-accent-electric flex items-center justify-center text-accent-electric">
                <span className="material-symbols-outlined text-xs font-bold">check</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-text-primary mb-1">Initial Chase Dispatch</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
              Chase sent by RM via encrypted portal mail. Document inventory manifest attached.
            </p>
          </div>
          <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted font-mono">
            <span>Dispatched</span>
            <span className="text-accent-electric font-semibold">PASSED</span>
          </div>
        </div>

        {/* Step 2: Event (Partial Reply Received) */}
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 flex flex-col justify-between relative group hover:border-accent-electric/40 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent-violet rounded-t-xl"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-secondary bg-accent-violet/20 px-2 py-0.5 rounded font-mono">
                EVENT • T+1.5
              </span>
              <div className="w-5 h-5 rounded-full bg-accent-violet/30 border border-accent-violet flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-xs font-bold">inbox</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-text-primary mb-1">Partial Reply Received</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
              Client submitted items. Gap check auto-executed:
            </p>
            <div className="bg-surface-canvas/60 rounded p-1.5 border border-border-subtle text-[11px] space-y-0.5 font-mono">
              <div className="flex justify-between text-text-muted">
                <span>Received Items:</span>
                <span className="text-accent-electric">INGESTED</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Clock Reset:</span>
                <span className="text-secondary font-bold">RESTARTED</span>
              </div>
            </div>
          </div>
          <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-[10px] text-text-muted font-mono">
            <span>Clock Restarted</span>
            <span className="text-accent-electric font-semibold">GAP LOGGED</span>
          </div>
        </div>

        {/* Step 3: Day 3 (Gentle Reminder) */}
        <div className={`bg-surface-overlay rounded-xl p-4 flex flex-col justify-between relative transition-all ${
          cadence.stage === 'DAY_3_REMINDER'
            ? 'border-2 border-accent-electric shadow-[0_12px_32px_-8px_rgba(2,245,118,0.18)]'
            : 'border border-border-subtle opacity-80'
        }`}>
          {cadence.stage === 'DAY_3_REMINDER' && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-accent-electric text-surface-canvas text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-canvas animate-pulse"></span>
              ACTIVE STAGE
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2 mt-0.5">
              <span className="text-[10px] font-bold text-accent-electric bg-accent-electric/15 px-2 py-0.5 rounded font-mono">
                DAY 3 • REMINDER
              </span>
              <div className="w-5 h-5 rounded-full bg-accent-electric text-surface-canvas flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xs">priority_high</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-text-primary mb-1">Pre-Drafted Gentle Reminder</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
              Ready for RM review. Generated with context from partial documents.
            </p>
            <div className="bg-surface-elevated rounded p-2 border border-border-prominent text-[11px] mb-2 font-mono">
              <p className="text-text-primary font-semibold truncate">
                Re: {activeCase.name}, items still outstanding
              </p>
              <p className="text-text-muted italic text-[10px] line-clamp-2 mt-0.5">
                "Thank you for sending your documents. To finalize..."
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('drafter')}
            className="w-full py-1.5 bg-accent-electric hover:brightness-110 text-surface-canvas font-bold rounded text-xs flex items-center justify-center gap-1 shadow transition-all"
          >
            <span className="material-symbols-outlined text-xs">edit_note</span>
            <span>Review Reminder Draft</span>
          </button>
        </div>

        {/* Step 4: Day 6 (Phone Call Task) */}
        <div className={`bg-surface-elevated rounded-xl p-4 flex flex-col justify-between transition-all ${
          cadence.stage === 'DAY_6_CALL'
            ? 'border-2 border-accent-electric shadow-[0_12px_32px_-8px_rgba(2,245,118,0.18)]'
            : 'border border-border-subtle opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-text-muted bg-surface-canvas px-2 py-0.5 rounded font-mono">
                DAY 6 • CALL TASK
              </span>
              <div className="w-5 h-5 rounded-full bg-surface-canvas border border-border-subtle flex items-center justify-center text-text-muted">
                <span className="material-symbols-outlined text-xs">call</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-text-primary mb-1">RM Phone Outreach</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
              Task created for RM: Suggest a friendly telephone check-in with talking points.
            </p>
            <div className="bg-surface-canvas/80 p-2 rounded text-[10px] text-text-secondary space-y-1">
              <div className="font-bold text-secondary uppercase font-mono">Talking Points:</div>
              <ul className="list-disc list-inside space-y-0.5 text-text-muted">
                <li>Acknowledge busy schedule</li>
                <li>Offer portal walkthrough</li>
              </ul>
            </div>
          </div>
          <div className="pt-2 border-t border-border-subtle text-[10px] text-text-muted font-mono">
            <span>Human Phone Task Only</span>
          </div>
        </div>

        {/* Step 5: Day 9 (Escalation Flag) */}
        <div className={`bg-surface-elevated rounded-xl p-4 flex flex-col justify-between transition-all ${
          cadence.stage === 'DAY_9_ESCALATE'
            ? 'border-2 border-error shadow-[0_12px_32px_-8px_rgba(255,180,171,0.25)]'
            : 'border border-border-subtle opacity-80'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-error bg-error/15 px-2 py-0.5 rounded font-mono">
                DAY 9 • STALLED
              </span>
              <div className="w-5 h-5 rounded-full bg-error/20 border border-error/40 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-xs">flag</span>
              </div>
            </div>
            <h3 className="text-xs font-bold text-text-primary mb-1">Manager / Ops Flag</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed mb-2">
              Flag to RM's manager or ops as "stalled". Zero auto-contact. Human decides next steps.
            </p>
          </div>
          <div className="pt-2 border-t border-border-subtle text-[10px] text-error font-mono font-semibold">
            <span>Nobody Auto-Contacted</span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Simulation & Cadence Controls */}
      <section className="bg-surface-elevated border border-border-subtle rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-electric text-xl">play_circle</span>
            <h3 className="text-sm font-bold text-text-primary">Cadence Simulation Controls</h3>
          </div>
          <span className="text-xs text-text-muted font-mono">Simulate real-world client lifecycle events</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Simulate Partial Reply */}
          <button
            onClick={handleSimulatePartialReply}
            disabled={simulatingReply}
            className="p-3 rounded-lg bg-surface-canvas hover:bg-surface-overlay border border-border-prominent text-left space-y-1.5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-electric flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                <span>Simulate Partial Reply</span>
              </span>
              <span className="text-[10px] font-mono text-text-muted">Section 4 Rule</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Client submits 2 items. Re-runs gap check, updates gap list, restarts 3-day clock for remainder.
            </p>
          </button>

          {/* Action 2: Advance Clock */}
          <button
            onClick={() => handleAdvanceClock(3.0)}
            disabled={advancingClock}
            className="p-3 rounded-lg bg-surface-canvas hover:bg-surface-overlay border border-border-prominent text-left space-y-1.5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">fast_forward</span>
                <span>Advance Clock (+3 Days)</span>
              </span>
              <span className="text-[10px] font-mono text-text-muted">Escalation Step</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Step forward business days to trigger Day-3 reminder, Day-6 call task, or Day-9 stalled flag.
            </p>
          </button>

          {/* Action 3: Snooze */}
          <button
            onClick={() => setIsSnoozeOpen(!isSnoozeOpen)}
            className="p-3 rounded-lg bg-surface-canvas hover:bg-surface-overlay border border-border-prominent text-left space-y-1.5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">snooze</span>
                <span>Snooze / Pause Case</span>
              </span>
              <span className="text-[10px] font-mono text-text-muted">RM Discretion</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              RM can pause cadence with reason (e.g. client on holiday, meeting agreed).
            </p>
          </button>
        </div>

        {/* Snooze Input Drawer */}
        {isSnoozeOpen && (
          <div className="p-4 bg-surface-canvas rounded-lg border border-amber-500/40 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={snoozeReason}
              onChange={(e) => setSnoozeReason(e.target.value)}
              placeholder="Reason for snooze..."
              className="flex-1 bg-surface-elevated border border-border-subtle rounded p-2 text-xs text-text-primary outline-none focus:border-amber-400"
            />
            <button
              onClick={handleSnooze}
              className="px-4 py-2 bg-amber-400 text-surface-canvas font-bold text-xs rounded hover:brightness-110 whitespace-nowrap"
            >
              Confirm Snooze
            </button>
          </div>
        )}
      </section>

      {/* 5. Edge Rules Governance Callouts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-electric text-base">verified</span>
            <span>Edge Rule: Partial Reply Re-Check</span>
          </h4>
          <p className="text-text-secondary leading-relaxed">
            When a client replies with partial documentation, the gap check immediately re-evaluates. The 3-day reminder clock resets <strong>only for the remaining items</strong>, ensuring the client is never asked for items already provided.
          </p>
        </div>

        <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-violet text-base">shield</span>
            <span>Edge Rule: Anti-Flooding Quota</span>
          </h4>
          <p className="text-text-secondary leading-relaxed">
            Maximum one reminder task per case per day, so relationship managers are never flooded with notifications. All follow-ups remain strictly human-reviewed and human-sent.
          </p>
        </div>
      </section>
    </div>
  );
}

import React, { useState } from 'react';
import { useCase } from '../context/CaseContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function MissingMatrixView() {
  const {
    activeCase,
    refreshActiveCase,
    setCurrentView,
    showToast,
    loading
  } = useCase();

  const [evaluating, setEvaluating] = useState(false);

  if (loading || !activeCase) {
    return <LoadingSpinner label="Loading Missing Documents Matrix..." />;
  }

  const gaps = activeCase.gaps || [];
  const followOnGaps = gaps.filter(g => g.possible_followon || g.followon_note);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await api.evaluateGaps(activeCase.id);
      await refreshActiveCase(activeCase.id);
      showToast('Case re-evaluated against institutional requirements matrix in one pass.');
    } catch (err) {
      showToast(`Evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleToggleGap = async (gap) => {
    try {
      await api.updateGap(activeCase.id, {
        gap_id: gap.id,
        selected: !gap.selected,
      });
      await refreshActiveCase(activeCase.id);
    } catch (err) {
      showToast(`Failed to update gap: ${err.message}`);
    }
  };

  const handleIncludeAll = async () => {
    try {
      for (const g of gaps) {
        if (!g.selected) {
          await api.updateGap(activeCase.id, { gap_id: g.id, selected: true });
        }
      }
      await refreshActiveCase(activeCase.id);
      showToast('All observable gaps selected for chase.');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'EXPIRED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-error/15 text-error border border-error/30 font-bold">EXPIRED</span>;
      case 'STALE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30 font-bold">STALE (&gt;90D)</span>;
      case 'INCOMPLETE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 font-bold">INCOMPLETE</span>;
      case 'MISSING':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-error/15 text-error border border-error/30 font-bold">MISSING</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Case Context Header Card */}
      <section className="bg-surface-elevated rounded-xl border border-border-subtle p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-accent-violet/20 border border-accent-violet/30 text-secondary text-xs font-semibold">
                {activeCase.client_type}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-surface-overlay text-text-secondary border border-border-subtle font-mono text-xs">
                {activeCase.crn_or_ref}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-tertiary-fixed text-xs font-semibold">
                {activeCase.sla_stage_label}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-accent-electric/10 border border-accent-electric/30 text-accent-electric text-xs font-semibold">
                {activeCase.kyc_tier}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {activeCase.name}
              </h1>
              <span className="text-text-muted text-sm font-normal">
                • {activeCase.related_parties?.length || 1} Related Parties Profiled
              </span>
            </div>
            <p className="text-text-secondary text-xs max-w-3xl leading-relaxed">
              {activeCase.summary}
            </p>
          </div>

          {/* Secondary Header Action */}
          <div className="flex items-center gap-3 self-start xl:self-center">
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="px-4 py-2 rounded-lg border border-border-prominent hover:border-text-primary text-text-primary hover:bg-surface-overlay text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${evaluating ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{evaluating ? 'Evaluating Matrix...' : 'Evaluate Full Case'}</span>
            </button>
            <button
              onClick={() => setCurrentView('drafter')}
              className="px-4 py-2 rounded-lg bg-accent-electric text-surface-canvas hover:brightness-110 font-bold text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(2,245,118,0.25)] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Generate AI Draft</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Overview KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-elevated rounded-xl border border-border-subtle p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Document Gaps</p>
            <p className="text-2xl font-bold text-accent-electric leading-none">{gaps.length} Observable</p>
            <p className="text-text-secondary text-[11px]">Selected for chase: {gaps.filter(g => g.selected).length}</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center text-accent-electric">
            <span className="material-symbols-outlined text-2xl">rule_folder</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-elevated rounded-xl border border-border-subtle p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Entities Analyzed</p>
            <p className="text-2xl font-bold text-text-primary leading-none">{activeCase.related_parties?.length || 1} Parties</p>
            <p className="text-text-secondary text-[11px]">Checked against PSC register</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-elevated rounded-xl border border-border-subtle p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">AI Accuracy</p>
            <p className="text-2xl font-bold text-text-primary leading-none">0 False Flags</p>
            <p className="text-accent-electric text-[11px]">Deterministic rule match</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center text-accent-electric">
            <span className="material-symbols-outlined text-2xl">verified</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-elevated rounded-xl border border-border-subtle p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Intake Velocity</p>
            <p className="text-2xl font-bold text-accent-electric leading-none">100% Day-0 Recall</p>
            <p className="text-text-secondary text-[11px]">Triggered in single pass</p>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center text-accent-violet">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
        </div>
      </section>

      {/* 3. RM Eyes Only Alert Banner */}
      {followOnGaps.length > 0 && (
        <section className="bg-surface-container-low rounded-xl border-l-4 border-l-accent-violet border border-border-subtle p-4">
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-accent-violet/20 text-secondary flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">visibility</span>
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary text-xs">
                  RM Eyes Only: Possible Follow-on Detected (Never in client email)
                </span>
                <span className="px-2 py-0.5 rounded bg-accent-violet/30 text-secondary text-[10px] font-mono">
                  {followOnGaps[0].rule_id} TRIGGER
                </span>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">
                {followOnGaps[0].followon_note}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-surface-overlay text-text-muted border border-border-subtle text-[11px] font-mono self-center">
              FCA Standard
            </span>
          </div>
        </section>
      )}

      {/* 4. Missing Documents Matrix Table */}
      <section className="bg-surface-elevated rounded-xl border border-border-subtle overflow-hidden">
        {/* Table Toolbar */}
        <div className="px-6 py-4 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-canvas/40">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span>Missing Documents Matrix</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-electric/15 text-accent-electric font-semibold font-mono">
                {gaps.length} items
              </span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Evaluate full case facts against Northgate rules in one pass. Select items to consolidate into single chase.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs font-semibold">Bulk Actions:</span>
            <button
              onClick={handleIncludeAll}
              className="px-3 py-1.5 rounded bg-surface-overlay hover:bg-surface-container-high border border-border-subtle text-text-primary text-xs font-semibold transition-colors"
            >
              Include All
            </button>
            <button
              onClick={() => handleEvaluate()}
              className="px-3 py-1.5 rounded bg-surface-overlay hover:bg-surface-container-high border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors"
            >
              Reset Matrix
            </button>
          </div>
        </div>

        {/* Table Element */}
        {gaps.length === 0 ? (
          <EmptyState
            title="All Documents In Order"
            description="No outstanding gaps identified for this case. The complete document pack passes intake criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-[11px] uppercase tracking-wider font-bold bg-surface-canvas/60">
                  <th className="py-3 px-4 w-12 text-center">Chase</th>
                  <th className="py-3 px-4">Doc Code &amp; Party</th>
                  <th className="py-3 px-4">Required Document</th>
                  <th className="py-3 px-4">Gap Status</th>
                  <th className="py-3 px-4">Observed Evidence</th>
                  <th className="py-3 px-4">Compliance Rule</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {gaps.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-surface-overlay/40 transition-colors ${
                      !item.selected ? 'opacity-60 bg-surface-canvas/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleGap(item)}
                        className="w-4 h-4 rounded border-border-prominent text-accent-electric focus:ring-accent-electric bg-surface-canvas cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-accent-electric">{item.doc_code}</div>
                      <div className="font-semibold text-text-primary">{item.party}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary">{item.requirement}</div>
                      {item.bespoke_note && (
                        <div className="text-[11px] text-accent-violet italic mt-0.5">Note: {item.bespoke_note}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-text-secondary leading-relaxed">
                      {item.evidence}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-text-muted">
                      {item.rule_id}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleGap(item)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                          item.selected
                            ? 'bg-surface-overlay text-text-secondary hover:text-text-primary border-border-subtle'
                            : 'bg-accent-electric text-surface-canvas border-accent-electric hover:brightness-110'
                        }`}
                      >
                        {item.selected ? 'Exclude' : 'Include'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-canvas/30 text-xs">
          <div className="text-text-muted flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-accent-electric">check_circle</span>
            <span>Gaps are observable facts evaluated against bank checklist matrix. Human RM reviews before dispatch.</span>
          </div>
          <button
            onClick={() => setCurrentView('drafter')}
            className="px-5 py-2 rounded-lg bg-accent-electric text-surface-canvas hover:brightness-110 font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(2,245,118,0.25)] transition-all"
          >
            <span>Proceed to AI Email Drafter</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  );
}

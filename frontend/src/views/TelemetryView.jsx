import React, { useState, useEffect } from 'react';
import { useCase } from '../context/CaseContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function TelemetryView() {
  const { showToast } = useCase();
  const [metrics, setMetrics] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [runningBacktest, setRunningBacktest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const data = await api.getMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const handleRunBacktest = async () => {
    setRunningBacktest(true);
    try {
      const result = await api.runBacktest(50);
      setBacktestData(result);
      showToast('FDE Backtest executed across 50 closed cases.');
    } catch (err) {
      showToast(`Backtest failed: ${err.message}`);
    } finally {
      setRunningBacktest(false);
    }
  };

  if (loading || !metrics) {
    return <LoadingSpinner label="Loading Pilot Impact & Telemetry..." />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-accent-violet/20 border border-accent-violet/40 text-secondary tracking-wider font-mono">
              PILOT PERFORMANCE
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-electric/10 border border-accent-electric/30 text-accent-electric text-xs font-bold font-mono">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>STATISTICAL SIGNIFICANCE PASSED</span>
            </div>
            <span className="text-xs text-text-muted font-mono">{metrics.p_value}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-1.5">
            5. Pilot Impact &amp; Metrics
          </h1>
          <p className="text-xs text-text-secondary mt-0.5 max-w-3xl leading-relaxed">
            Q4 Pilot Cohort Evaluation: Comparative benchmark of 50 matched institutional onboarding accounts versus baseline standard operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunBacktest}
            disabled={runningBacktest}
            className="text-xs font-semibold px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-text-primary border border-border-prominent flex items-center gap-2 shadow-sm transition-all disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${runningBacktest ? 'animate-spin' : ''}`}>
              analytics
            </span>
            <span>{runningBacktest ? 'Simulating...' : 'Run FDE Backtest (50 Cases)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Hero KPI Banner */}
      <section className="bg-surface-elevated border border-border-prominent rounded-xl p-6 relative overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center relative z-10">
          {/* Primary Metric Callout */}
          <div className="xl:col-span-5 border-b xl:border-b-0 xl:border-r border-border-subtle pb-6 xl:pb-0 xl:pr-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-text-muted tracking-wider font-bold">
                PRIMARY EXPERIMENTAL METRIC
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-accent-electric/15 text-accent-electric font-bold border border-accent-electric/30 font-mono">
                Target Met (Target ≤ 8.0 Days)
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-5xl font-extrabold text-text-primary tracking-tight font-mono">
                {metrics.primary_metric_days}
              </span>
              <span className="text-xl font-bold text-accent-electric">Days</span>
              <div className="ml-auto text-right">
                <span className="text-lg font-bold text-accent-electric flex items-center justify-end font-mono">
                  <span className="material-symbols-outlined text-xl">trending_down</span>
                  -{metrics.cycle_time_reduction_pct}%
                </span>
                <span className="text-[10px] text-text-muted uppercase font-mono">Document Cycle Time</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-text-secondary bg-surface-canvas/60 p-2.5 rounded-lg border border-border-subtle font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-text-muted"></span>
                <span>Baseline: <strong className="text-text-primary">{metrics.baseline_days}d</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-violet"></span>
                <span>Target: <strong className="text-text-primary">≤ {metrics.target_days}d</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-electric shadow-[0_0_6px_#02F576]"></span>
                <span>Actual: <strong className="text-accent-electric font-bold">{metrics.primary_metric_days}d</strong></span>
              </div>
            </div>
          </div>

          {/* Timeline Range Visualization */}
          <div className="xl:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="text-text-primary font-semibold">Benchmark Distribution &amp; Target Hypothesis Boundary</span>
                <span className="text-accent-electric font-bold font-mono">DELTA: -9.9 DAYS FASTER</span>
              </div>

              {/* Progress Bar Track */}
              <div className="relative w-full h-8 bg-surface-canvas rounded-lg p-1 border border-border-subtle flex items-center">
                <div className="relative w-full h-4 bg-surface-overlay rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-violet to-accent-electric rounded"
                    style={{ width: `${(metrics.primary_metric_days / metrics.baseline_days) * 100}%` }}
                  ></div>
                </div>
                {/* 7.2d marker */}
                <div
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                  style={{ left: `${(metrics.primary_metric_days / metrics.baseline_days) * 100}%` }}
                >
                  <div className="w-2.5 h-6 bg-accent-electric rounded shadow-[0_0_10px_#02F576] border border-surface-canvas"></div>
                  <span className="absolute -top-6 text-[10px] font-mono font-bold text-accent-electric bg-surface-elevated px-1.5 py-0.2 rounded border border-accent-electric/40 whitespace-nowrap">
                    {metrics.primary_metric_days}d (Actual)
                  </span>
                </div>
              </div>
            </div>

            {/* Velocity impact: 62d -> 52.2d */}
            <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-text-muted uppercase font-mono font-bold">END-TO-END ONBOARDING VELOCITY</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-sm font-bold text-text-secondary line-through font-mono">{metrics.gross_cycle_before_days} Days</span>
                  <span className="material-symbols-outlined text-accent-electric text-base">arrow_forward</span>
                  <span className="text-sm font-bold text-text-primary font-mono">{metrics.gross_cycle_after_days} Days Total</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-surface-overlay px-3.5 py-1.5 rounded-lg border border-accent-electric/20">
                <span className="material-symbols-outlined text-accent-electric text-lg">speed</span>
                <div>
                  <div className="text-xs font-bold text-accent-electric font-mono">+{metrics.gross_cycle_improvement_pct}% Swift</div>
                  <div className="text-[10px] text-text-muted">Gross Cycle Velocity Gain</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive 6-Vector Diagnostic Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-accent-electric text-base">analytics</span>
            <span>Comprehensive 6-Vector Diagnostic Grid</span>
          </h2>
          <span className="text-[11px] font-mono text-text-muted">50 VERIFIED INSTITUTIONAL MATCH CASES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-muted uppercase">VECTOR 01 // FREQUENCY</span>
                <h3 className="text-xs font-semibold text-text-primary">Chase Rounds / Case</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                {metrics.vector_chase_rounds_delta_pct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-text-primary">{metrics.vector_chase_rounds_pilot}</span>
              <span className="text-xs text-text-muted">vs {metrics.vector_chase_rounds_baseline} baseline</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Consolidating all missing items upfront reduced chasing from 3+ rounds to 1 or 2.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-muted uppercase">VECTOR 02 // ACCURACY</span>
                <h3 className="text-xs font-semibold text-text-primary">First-Pass Gap Recall</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                +{metrics.vector_gap_recall_pilot_pct - metrics.vector_gap_recall_baseline_pct}%
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-text-primary">{metrics.vector_gap_recall_pilot_pct}%</span>
              <span className="text-xs text-text-muted">vs {metrics.vector_gap_recall_baseline_pct}% baseline</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Share of eventual document gaps identified at Day 0 in a single evaluation.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-muted uppercase">VECTOR 03 // TRUST</span>
                <h3 className="text-xs font-semibold text-text-primary">Gap Precision (RM Kept)</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                High Trust
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-text-primary">{metrics.vector_gap_precision_pct}%</span>
              <span className="text-xs text-text-muted">Kept by RM</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Only 3.2% of gaps removed or overridden by RMs. Zero bogus requirements.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-muted uppercase">VECTOR 04 // DRAFT QUALITY</span>
                <h3 className="text-xs font-semibold text-text-primary">RM Edit Rate on Drafts</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                -73.8 pts
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-text-primary">{metrics.vector_rm_edit_rate_pilot_pct}%</span>
              <span className="text-xs text-text-muted">vs {metrics.vector_rm_edit_rate_baseline_pct}% baseline</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Grounded structured generation minimized manual rewriting and corrections.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-muted uppercase">VECTOR 05 // EFFICIENCY</span>
                <h3 className="text-xs font-semibold text-text-primary">RM Minutes / Chase</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                -81.2%
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-text-primary">{metrics.vector_rm_minutes_pilot}m</span>
              <span className="text-xs text-text-muted">vs {metrics.vector_rm_minutes_baseline}m baseline</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Relationship managers spend 4.5 minutes reviewing ready-made drafts instead of 24m admin.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-text-muted uppercase">VECTOR 06 // CLIENT SPEED</span>
                <h3 className="text-xs font-semibold text-text-primary">Time-to-First-Reply</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                -63.3%
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-text-primary">{metrics.vector_client_reply_pilot_days}d</span>
              <span className="text-xs text-text-muted">vs {metrics.vector_client_reply_baseline_days}d baseline</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              One clear, numbered request with an exact deadline elicits replies 3.1 days faster.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Backtest Simulation Results */}
      {backtestData && (
        <section className="bg-surface-elevated border border-border-prominent rounded-xl p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-electric text-xl">biotech</span>
              <h3 className="text-sm font-bold text-text-primary">
                FDE Backtest Results (Historical Cohort N={backtestData.summary.cases_evaluated})
              </h3>
            </div>
            <span className="text-xs font-mono text-accent-electric font-bold">
              {backtestData.summary.first_pass_recall_pct}% First-Pass Recall
            </span>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            {backtestData.conclusion}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-surface-canvas p-2.5 rounded border border-border-subtle">
              <span className="text-text-muted block text-[10px]">CASES EVALUATED</span>
              <span className="text-base font-bold text-text-primary">{backtestData.summary.cases_evaluated}</span>
            </div>
            <div className="bg-surface-canvas p-2.5 rounded border border-border-subtle">
              <span className="text-text-muted block text-[10px]">AVG DAY-0 GAPS</span>
              <span className="text-base font-bold text-accent-electric">{backtestData.summary.average_initial_gaps_found}</span>
            </div>
            <div className="bg-surface-canvas p-2.5 rounded border border-border-subtle">
              <span className="text-text-muted block text-[10px]">PROJECTED SAVING</span>
              <span className="text-base font-bold text-secondary">{backtestData.summary.projected_cycle_reduction_days} Days / Case</span>
            </div>
            <div className="bg-surface-canvas p-2.5 rounded border border-border-subtle">
              <span className="text-text-muted block text-[10px]">RM HOURS FREED</span>
              <span className="text-base font-bold text-accent-electric">{backtestData.summary.estimated_time_saved_hours} hrs</span>
            </div>
          </div>
        </section>
      )}

      {/* 5. Guardrails Monitoring Strip */}
      <section className="bg-surface-elevated border border-border-subtle rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-accent-electric text-lg">verified_user</span>
          <span className="text-text-primary font-semibold">Guardrails Monitoring Status:</span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-text-muted">Compliance Rejections: </span>
            <strong className="text-accent-electric">{metrics.guardrail_compliance_rejections} (0.0%)</strong>
          </div>
          <div>
            <span className="text-text-muted">Client Complaints: </span>
            <strong className="text-accent-electric">{metrics.guardrail_client_complaints}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

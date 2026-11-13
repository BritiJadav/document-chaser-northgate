import React from 'react';
import { useCase } from '../context/CaseContext';

export default function Header() {
  const {
    cases,
    activeCaseId,
    switchCase,
    currentView,
    setCurrentView,
    resetDemo,
    activeCase
  } = useCase();

  return (
    <header className="bg-surface-canvas/90 backdrop-blur-md text-primary docked full-width top-0 sticky z-50 border-b border-border-subtle shadow-none transition-all duration-150">
      <div className="w-full px-6 lg:px-10 flex items-center justify-between h-16 max-w-[1440px] mx-auto">
        {/* Brand & Search cluster */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center">
              <span className="material-symbols-outlined text-accent-electric text-xl" data-icon="account_balance">account_balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-accent-electric tracking-tight text-lg">Northgate Bank</span>
              <span className="text-text-primary hidden xl:inline text-sm font-semibold">Document Chaser Copilot</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-accent-violet/20 border border-accent-violet/40 text-secondary text-[11px] font-bold ml-1">
              v2.4 Enterprise
            </span>
          </div>

          {/* Case Switcher & Search Bar */}
          <div className="relative w-72 hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-text-muted text-[18px]">search</span>
            <select
              value={activeCaseId}
              onChange={(e) => switchCase(e.target.value)}
              className="w-full h-9 pl-9 pr-8 bg-surface-elevated text-text-primary text-xs rounded-lg border border-border-subtle focus:border-accent-electric focus:ring-1 focus:ring-accent-electric/30 outline-none appearance-none cursor-pointer transition-all"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface-elevated text-text-primary">
                  {c.name} ({c.client_type})
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-text-muted text-[16px] pointer-events-none">expand_more</span>
          </div>
        </div>

        {/* Navigation Links from Prototypes */}
        <nav className="hidden xl:flex items-center space-x-6 text-xs font-semibold">
          <button
            onClick={() => setCurrentView('matrix')}
            className={`pb-1 transition-colors border-b-2 ${
              currentView === 'matrix'
                ? 'border-accent-electric text-accent-electric'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Missing Documents Matrix
          </button>
          <button
            onClick={() => setCurrentView('drafter')}
            className={`pb-1 transition-colors border-b-2 ${
              currentView === 'drafter'
                ? 'border-accent-electric text-accent-electric'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            AI Draft Chase Email
          </button>
          <button
            onClick={() => setCurrentView('review')}
            className={`pb-1 transition-colors border-b-2 ${
              currentView === 'review'
                ? 'border-accent-electric text-accent-electric'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            RM Review &amp; Send
          </button>
          <button
            onClick={() => setCurrentView('cadence')}
            className={`pb-1 transition-colors border-b-2 ${
              currentView === 'cadence'
                ? 'border-accent-electric text-accent-electric'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Follow-Up Cadence
          </button>
          <button
            onClick={() => setCurrentView('telemetry')}
            className={`pb-1 transition-colors border-b-2 ${
              currentView === 'telemetry'
                ? 'border-accent-electric text-accent-electric'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Pilot Metrics
          </button>
          <button
            onClick={() => setCurrentView('guardrails')}
            className={`pb-1 transition-colors border-b-2 ${
              currentView === 'guardrails'
                ? 'border-accent-electric text-accent-electric'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Scope &amp; Guardrails
          </button>
        </nav>

        {/* Trailing Actions & RM Profile Avatar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-border-subtle pr-3">
            <button
              onClick={resetDemo}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-accent-electric hover:bg-surface-elevated transition-colors"
              title="Reset Database to Pristine Seed"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="restart_alt">restart_alt</span>
            </button>
            <button
              onClick={() => setCurrentView('guardrails')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title="Security &amp; Policy Status"
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="shield">shield</span>
            </button>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-violet to-accent-electric p-0.5">
              <div className="w-full h-full rounded-full bg-surface-canvas flex items-center justify-center text-xs font-bold text-accent-electric">
                MS
              </div>
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs text-text-primary font-semibold leading-tight">{activeCase?.assigned_rm || "Meera Shah"}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Lead RM · UK Corporate</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

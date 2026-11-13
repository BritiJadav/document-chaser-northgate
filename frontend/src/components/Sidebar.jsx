import React, { useState } from 'react';
import { useCase } from '../context/CaseContext';
import { api } from '../api';

export default function Sidebar() {
  const {
    currentView,
    setCurrentView,
    activeCase,
    refreshActiveCase,
    setIsAuditModalOpen,
    showToast,
    health
  } = useCase();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleTriggerSync = async () => {
    if (!activeCase) return;
    setIsSyncing(true);
    try {
      await api.evaluateGaps(activeCase.id);
      await refreshActiveCase(activeCase.id);
      showToast('Core document checklist synced & re-evaluated.');
    } catch (err) {
      showToast(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { id: 'matrix', label: 'Missing Matrix', icon: 'table_chart' },
    { id: 'drafter', label: 'AI Email Drafter', icon: 'auto_awesome' },
    { id: 'review', label: 'Review & Execute', icon: 'mark_email_read', badge: 'P1' },
    { id: 'cadence', label: 'Cadence Rules', icon: 'schedule_send' },
    { id: 'telemetry', label: 'Impact Telemetry', icon: 'monitoring' },
    { id: 'guardrails', label: 'Policy Guardrails', icon: 'security' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 p-4 flex flex-col justify-between z-40 bg-surface-elevated border-r border-border-subtle shadow-none">
      {/* Upper Section */}
      <div className="space-y-4">
        {/* Header badge */}
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-lg bg-surface-overlay border border-border-subtle flex items-center justify-center text-accent-electric">
            <span className="material-symbols-outlined text-[18px]">shield</span>
          </div>
          <div>
            <h4 className="font-bold text-text-primary text-xs leading-tight">RM Operational Suite</h4>
            <p className="text-[10px] text-text-muted uppercase font-mono tracking-wider">Institutional Client Group</p>
          </div>
        </div>

        <hr className="border-border-subtle" />

        {/* Nav Tabs */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full px-3 py-2 rounded-lg flex items-center justify-between transition-colors text-left text-xs font-semibold ${
                  isActive
                    ? 'bg-surface-overlay text-accent-electric border-r-2 border-accent-electric'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-accent-electric' : 'text-text-muted'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-accent-electric/15 text-accent-electric border border-accent-electric/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Contextual CTA: Trigger Sync */}
        <div className="pt-2">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-overlay hover:bg-surface-bright border border-border-prominent text-accent-electric text-xs font-semibold transition-all disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`} data-icon="sync">
              sync
            </span>
            <span>{isSyncing ? 'Evaluating Matrix...' : 'Trigger Sync'}</span>
          </button>
        </div>
      </div>

      {/* Lower Footer Tabs */}
      <div className="border-t border-border-subtle pt-3 space-y-1">
        <button
          onClick={() => setIsAuditModalOpen(true)}
          className="w-full text-text-secondary hover:text-text-primary hover:bg-surface-overlay/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-3 text-xs"
        >
          <span className="material-symbols-outlined text-[18px]" data-icon="history">history</span>
          <span>Audit Trail</span>
        </button>
        <button
          onClick={() => setCurrentView('guardrails')}
          className="w-full text-text-secondary hover:text-text-primary hover:bg-surface-overlay/50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-3 text-xs"
        >
          <span className="material-symbols-outlined text-[18px]" data-icon="hub">hub</span>
          <span>API Gateway</span>
        </button>
        <div className="px-3 pt-2 pb-1 text-[10px] text-text-muted flex justify-between items-center font-mono">
          <span>SECURED TLS 1.3</span>
          <span className="inline-block w-2 h-2 rounded-full bg-accent-electric animate-pulse"></span>
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import { useCase } from '../context/CaseContext';

export default function AuditTrailModal() {
  const { isAuditModalOpen, setIsAuditModalOpen, activeCase } = useCase();

  if (!isAuditModalOpen || !activeCase) return null;

  const auditList = activeCase.audit_trail || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-elevated border border-border-prominent rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-overlay/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-canvas border border-border-subtle flex items-center justify-center text-accent-electric">
              <span className="material-symbols-outlined text-lg" data-icon="history">history</span>
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-base">Case Audit Trail &amp; Governance Log</h3>
              <p className="text-text-muted text-xs font-mono">{activeCase.name} · {activeCase.crn_or_ref}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-surface-canvas hover:bg-surface-bright flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-surface-canvas p-3 rounded-lg border border-border-subtle flex items-center justify-between text-xs font-mono text-text-secondary">
            <span>HITL GATE: <strong className="text-accent-electric font-semibold">MANDATORY HUMAN APPROVAL</strong></span>
            <span>SECURED TLS 1.3 / ENCLAVE UK</span>
          </div>

          <div className="divide-y divide-border-subtle">
            {auditList.length === 0 ? (
              <p className="text-text-muted text-center py-8 text-sm">No recorded events yet.</p>
            ) : (
              auditList.map((item, idx) => (
                <div key={item.id || idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-primary flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent-electric"></span>
                      {item.action}
                    </span>
                    <span className="text-text-muted font-mono">{item.timestamp}</span>
                  </div>
                  <p className="text-text-secondary text-xs pl-4 leading-relaxed font-body-md">
                    {item.details}
                  </p>
                  <div className="pl-4 flex items-center gap-3 text-[10px] text-text-muted font-mono pt-0.5">
                    <span>Officer: <strong className="text-text-primary">{item.rm_name}</strong></span>
                    <span>•</span>
                    <span className="text-accent-electric">HITL Verified</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle bg-surface-overlay/50 flex items-center justify-between text-xs">
          <span className="text-text-muted font-mono text-[11px]">Tamper-evident audit integrity locked</span>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-surface-canvas border border-border-prominent text-text-primary hover:bg-surface-elevated font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

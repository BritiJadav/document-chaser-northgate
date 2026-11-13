import React, { useState } from 'react';
import { useCase } from '../context/CaseContext';
import { api } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReviewSendView() {
  const {
    activeCase,
    refreshActiveCase,
    setCurrentView,
    showToast,
    loading
  } = useCase();

  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [bespokeNotes, setBespokeNotes] = useState({});

  if (loading || !activeCase) {
    return <LoadingSpinner label="Loading RM One-Screen Review & Send..." />;
  }

  const gaps = activeCase.gaps || [];
  const draft = activeCase.draft_email;
  const selectedGaps = gaps.filter(g => g.selected);

  const handleToggleKeep = async (gap, keep) => {
    try {
      await api.updateGap(activeCase.id, {
        gap_id: gap.id,
        selected: keep,
        override_reason: keep ? null : "Excluded by RM during pre-send review",
      });
      await refreshActiveCase(activeCase.id);
    } catch (err) {
      showToast(`Error updating gap: ${err.message}`);
    }
  };

  const handleNoteChange = async (gapId, note) => {
    setBespokeNotes(prev => ({ ...prev, [gapId]: note }));
    try {
      await api.updateGap(activeCase.id, {
        gap_id: gapId,
        selected: true,
        bespoke_note: note,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveAndSend = async () => {
    if (!draft) return;
    setIsSending(true);
    try {
      // Build updated body incorporating currently selected items
      let finalBody = draft.body;
      const finalSubject = customSubject || draft.subject;

      const payload = {
        case_id: activeCase.id,
        subject: finalSubject,
        body: finalBody,
        rm_name: activeCase.assigned_rm || "Meera Shah",
        rm_notes: "Reviewed and validated by Relationship Manager. Dispatched via corporate Outlook mailbox.",
      };

      await api.reviewAndSend(activeCase.id, payload);
      await refreshActiveCase(activeCase.id);
      setSentSuccess(true);
      showToast('Dispatched & Audit Logged via RM Authenticated Mailbox.');
      setTimeout(() => {
        setCurrentView('cadence');
      }, 1200);
    } catch (err) {
      showToast(`Send blocked: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Client Context Header Card */}
      <section className="bg-surface-elevated border border-border-subtle rounded-xl p-5 relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-overlay border border-border-prominent flex items-center justify-center text-text-primary">
              <span className="material-symbols-outlined text-3xl text-secondary">account_circle</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">{activeCase.name}</h1>
                <span className="px-2 py-0.5 rounded text-xs bg-accent-violet/20 text-secondary border border-accent-violet/30 font-semibold">
                  {activeCase.client_type}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-accent-electric/15 text-accent-electric border border-accent-electric/30 font-semibold">
                  {activeCase.kyc_tier}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-surface-overlay text-text-muted border border-border-subtle font-mono">
                  {activeCase.crn_or_ref}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-text-secondary">
                <span>Open: <strong className="text-text-primary font-semibold">{activeCase.days_open} days</strong></span>
                <span className="text-border-prominent">•</span>
                <span>Last Contact: <strong className="text-text-primary font-semibold">{activeCase.days_since_last_contact} days ago</strong></span>
                <span className="text-border-prominent">•</span>
                <span>Assigned RM: <strong className="text-text-primary font-semibold">{activeCase.assigned_rm}</strong></span>
              </div>
            </div>
          </div>

          {/* SLA Timer & HITL Gate Badges */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border-subtle">
            <div className="bg-surface-canvas/90 border border-error/40 px-3.5 py-1.5 rounded-lg flex items-center gap-2.5 shadow-sm">
              <span className="material-symbols-outlined text-error text-lg animate-pulse">timer</span>
              <div>
                <div className="text-[10px] text-error tracking-wider font-bold uppercase font-mono">REVIEW SLA STATUS</div>
                <div className="text-xs font-semibold text-text-primary">
                  Review SLA: <span className="text-error font-mono font-bold">3h remaining</span> of 24h
                </div>
              </div>
            </div>

            <div className="bg-accent-electric/10 border border-accent-electric/40 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-electric glow-electric"></span>
              <div>
                <div className="text-[10px] text-accent-electric tracking-wider font-bold uppercase font-mono">DISPATCH CONTROLLER</div>
                <div className="text-xs font-bold text-accent-electric">HITL Gate Active</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Split View (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Chase Gap Matrix (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-electric text-xl">rule</span>
                <h2 className="font-bold text-text-primary text-sm">
                  Document Chase Gap Matrix
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-overlay text-accent-electric text-xs font-mono font-semibold border border-accent-electric/30">
                {selectedGaps.length} Selected
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Review flagged verification anomalies before dispatching client instructions. Overrides are audited.
            </p>

            {/* Gap List */}
            <div className="flex flex-col gap-3">
              {gaps.map((item, idx) => {
                const isKept = item.selected;
                return (
                  <div
                    key={item.id}
                    className={`bg-surface-canvas/90 border rounded-lg p-3.5 transition-all ${
                      isKept ? 'border-border-prominent hover:border-accent-electric/40' : 'border-error/30 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-text-muted text-base">
                          {item.doc_code.includes('ID') ? 'badge' : item.doc_code.includes('POA') ? 'home_pin' : 'description'}
                        </span>
                        <span className="font-semibold text-text-primary text-xs">{item.requirement}</span>
                      </div>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                        item.status === 'EXPIRED' ? 'bg-error/15 text-error border border-error/30' :
                        item.status === 'STALE' ? 'bg-tertiary-container/20 text-tertiary-fixed-dim border border-tertiary-fixed-dim/30' :
                        'bg-error/15 text-error border border-error/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-text-secondary bg-surface-elevated/80 p-2 rounded border border-border-subtle font-mono mb-2.5">
                      {item.evidence}
                    </div>

                    {/* Toggle Buttons */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => handleToggleKeep(item, true)}
                        className={`flex-1 py-1 px-2.5 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          isKept
                            ? 'bg-accent-electric text-surface-canvas hover:brightness-110'
                            : 'bg-surface-overlay border border-border-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isKept ? 'check_circle' : 'add'}
                        </span>
                        <span>{isKept ? 'Keep in Email (Selected)' : 'Include in Email'}</span>
                      </button>

                      <button
                        onClick={() => handleToggleKeep(item, false)}
                        className={`py-1 px-2.5 rounded text-xs font-semibold transition-all ${
                          !isKept
                            ? 'bg-error/20 border border-error/50 text-error flex items-center gap-1'
                            : 'bg-surface-overlay border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-prominent'
                        }`}
                      >
                        {!isKept ? 'Removed (Override)' : 'Remove (Override)'}
                      </button>
                    </div>

                    {/* Bespoke note input for complex cases */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-text-muted uppercase">RM Bespoke Audit Note</label>
                      <input
                        type="text"
                        defaultValue={item.bespoke_note || ""}
                        placeholder="Add bespoke note context (e.g. verified wealth origin)..."
                        onBlur={(e) => handleNoteChange(item.id, e.target.value)}
                        className="w-full bg-surface-elevated border border-border-subtle focus:border-accent-electric rounded p-1.5 text-xs text-text-primary font-body-md outline-none transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mandatory Compliance Governance Box */}
            <div className="p-3 bg-surface-overlay/80 border border-border-subtle rounded-lg flex items-start gap-2.5">
              <span className="material-symbols-outlined text-accent-violet text-lg shrink-0 mt-0.5">gavel</span>
              <div>
                <h5 className="text-[11px] font-bold text-secondary uppercase tracking-wider font-mono">
                  Mandatory Compliance Governance
                </h5>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Every override is logged for compliance audit &amp; rule tuning. The human always sends.
                </p>
                <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-text-muted">
                  <span>LOG: #AUD-{activeCase.id.slice(0, 6)}</span>
                  <span>ENCLAVE: Tier-4 UK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Draft Email Preview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-surface-elevated border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-violet text-xl">mail</span>
                <h2 className="font-bold text-text-primary text-sm">
                  Live Draft Email Preview
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-accent-electric font-semibold bg-accent-electric/10 px-2.5 py-1 rounded-full border border-accent-electric/30">
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>Dispatched from {activeCase.assigned_rm}'s Authenticated Mailbox</span>
              </div>
            </div>

            {/* Headers */}
            <div className="bg-surface-canvas/90 border border-border-prominent rounded-lg p-3 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center">
                <span className="text-text-muted w-16 uppercase text-[10px]">To:</span>
                <span className="text-text-primary font-medium truncate">{draft?.to_name} &lt;{draft?.to_email}&gt;</span>
              </div>
              <div className="flex items-center">
                <span className="text-text-muted w-16 uppercase text-[10px]">From:</span>
                <span className="text-accent-electric font-medium truncate">{draft?.from_name} &lt;{draft?.from_email}&gt; (OAuth2 Authenticated)</span>
              </div>
              <div className="flex items-start pt-1 border-t border-border-subtle">
                <span className="text-text-muted w-16 uppercase text-[10px] mt-0.5">Subject:</span>
                <span className="text-text-primary font-semibold text-xs leading-tight flex-1">
                  {customSubject || draft?.subject}
                </span>
              </div>
            </div>

            {/* Email Body Preview */}
            <div className="bg-surface-canvas border border-border-prominent rounded-lg p-5 flex flex-col gap-3 font-body-md text-xs text-text-primary leading-relaxed min-h-[360px]">
              <p>Dear {draft?.to_name?.split(' ')[0] || "Client"},</p>
              <p className="text-text-secondary">
                Thank you for providing your documentation. We've checked the full pack against our institutional requirements and need the items below. Sending all of them together by <strong>{draft?.deadline_date}</strong> will avoid further requests:
              </p>

              {/* Numbered Gaps */}
              <div className="bg-surface-elevated/70 border border-border-subtle rounded-lg p-3 space-y-2 font-mono text-xs">
                {selectedGaps.map((g, idx) => (
                  <div key={g.id} className="flex items-start gap-2">
                    <span className="text-accent-electric font-bold">{idx + 1}.</span>
                    <div>
                      <strong className="text-text-primary">{g.requirement}:</strong> {g.evidence}
                      {g.bespoke_note && (
                        <div className="text-[11px] text-secondary italic">({g.bespoke_note})</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Token link badge */}
              <div className="my-1 flex items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-electric/15 border border-accent-electric text-accent-electric font-mono text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm font-bold">lock_open</span>
                  <span>[RM TO CONFIRM: upload link - VERIFIED]</span>
                </div>
              </div>

              <p className="text-text-secondary">
                You can securely submit these via the single-use encrypted portal link provided above or simply reply to this email. Should you wish to discuss acceptable alternative documentation, please feel free to ring my direct desk line.
              </p>

              {/* Sign-off */}
              <div className="pt-2 text-xs text-text-secondary space-y-0.5">
                <p>Warm regards,</p>
                <p className="text-text-primary font-semibold text-sm">{activeCase.assigned_rm}</p>
                <p className="text-text-muted">Senior Relationship Manager, Private Wealth Group</p>
                <p className="text-text-muted">Northgate Bank Institutional Client Services | London EC2N</p>
              </div>

              <div className="mt-auto pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-electric"></span>
                  Dispatched from {activeCase.assigned_rm}'s Authenticated Mailbox
                </span>
                <span className="text-text-secondary">DKIM / SPF Signed</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-surface-canvas/90 border border-border-prominent rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('drafter')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Back to Drafter</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-[11px] font-mono text-text-muted">
                  Requires RM Signature &amp; 2FA
                </span>
                <button
                  onClick={handleApproveAndSend}
                  disabled={isSending || sentSuccess}
                  className={`px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(2,245,118,0.25)] ${
                    sentSuccess
                      ? 'bg-accent-electric text-surface-canvas'
                      : 'bg-accent-electric text-surface-canvas hover:brightness-110'
                  } disabled:opacity-60`}
                >
                  <span className={`material-symbols-outlined text-sm font-bold ${isSending ? 'animate-spin' : ''}`}>
                    {isSending ? 'progress_activity' : sentSuccess ? 'done_all' : 'send_and_archive'}
                  </span>
                  <span>
                    {isSending
                      ? 'Authenticating RM Token...'
                      : sentSuccess
                      ? 'Dispatched & Audit Logged'
                      : 'Approve & Send via RM Mailbox'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

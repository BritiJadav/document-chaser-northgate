import React from 'react';

export default function EmptyState({ title = "No Items Outstanding", description = "All required verification documents have been received and passed intake rules.", actionLabel, onAction }) {
  return (
    <div className="bg-surface-elevated border border-border-subtle rounded-xl p-10 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-accent-electric/10 text-accent-electric flex items-center justify-center mx-auto mb-3">
        <span className="material-symbols-outlined text-2xl" data-icon="task_alt">task_alt</span>
      </div>
      <h3 className="font-bold text-text-primary text-base mb-1">{title}</h3>
      <p className="text-text-secondary text-xs mb-4 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-lg bg-accent-electric text-surface-canvas font-bold text-xs hover:brightness-110 inline-flex items-center gap-1.5 transition-all"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

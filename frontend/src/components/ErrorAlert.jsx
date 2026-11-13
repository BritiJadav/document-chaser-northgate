import React from 'react';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="bg-error-container/20 border border-error/40 rounded-xl p-6 text-center max-w-xl mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-error/20 text-error flex items-center justify-center mx-auto mb-3">
        <span className="material-symbols-outlined text-2xl" data-icon="error">error</span>
      </div>
      <h3 className="font-bold text-text-primary text-lg mb-1">Operational Exception</h3>
      <p className="text-text-secondary text-sm mb-4 leading-relaxed font-body-md">
        {message || "An unexpected error occurred while communicating with the document chasing engine."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-surface-overlay text-text-primary border border-border-prominent text-xs font-semibold inline-flex items-center gap-2 transition-all"
        >
          <span className="material-symbols-outlined text-sm" data-icon="refresh">refresh</span>
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}

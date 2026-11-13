import React from 'react';

export default function LoadingSpinner({ label = "Loading case telemetry..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 space-y-4">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-accent-electric/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-accent-electric border-t-transparent animate-spin"></div>
        <span className="material-symbols-outlined text-accent-electric text-xl" data-icon="sync">sync</span>
      </div>
      <p className="text-text-secondary font-medium text-sm animate-pulse tracking-wide font-mono">
        {label}
      </p>
    </div>
  );
}

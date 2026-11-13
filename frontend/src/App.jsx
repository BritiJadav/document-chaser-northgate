import React from 'react';
import { useCase } from './context/CaseContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AuditTrailModal from './components/AuditTrailModal';
import MissingMatrixView from './views/MissingMatrixView';
import AiDraftView from './views/AiDraftView';
import ReviewSendView from './views/ReviewSendView';
import CadenceView from './views/CadenceView';
import TelemetryView from './views/TelemetryView';
import GuardrailsView from './views/GuardrailsView';
import ErrorAlert from './components/ErrorAlert';

export default function App() {
  const { currentView, error, refreshActiveCase, toastMessage } = useCase();

  const renderActiveView = () => {
    switch (currentView) {
      case 'matrix':
        return <MissingMatrixView />;
      case 'drafter':
        return <AiDraftView />;
      case 'review':
        return <ReviewSendView />;
      case 'cadence':
        return <CadenceView />;
      case 'telemetry':
        return <TelemetryView />;
      case 'guardrails':
        return <GuardrailsView />;
      default:
        return <MissingMatrixView />;
    }
  };

  return (
    <div className="bg-surface-canvas min-h-screen flex flex-col text-text-primary">
      {/* Top App Bar */}
      <Header />

      {/* Body Wrapper */}
      <div className="flex max-w-[1440px] mx-auto w-full min-h-[calc(100vh-64px)]">
        {/* Docked Sidebar Navigation */}
        <Sidebar />

        {/* Main Workspace Offset by Sidebar (256px / 16rem) */}
        <main className="ml-64 flex-1 p-6 lg:p-8 max-w-[calc(1440px-16rem)] overflow-x-hidden">
          {error ? (
            <ErrorAlert message={error} onRetry={() => refreshActiveCase()} />
          ) : (
            renderActiveView()
          )}
        </main>
      </div>

      {/* Modal & Overlays */}
      <AuditTrailModal />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-elevated border border-accent-electric text-text-primary px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <span className="material-symbols-outlined text-accent-electric text-base">info</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

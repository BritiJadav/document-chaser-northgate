import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const CaseContext = createContext(null);

export function CaseProvider({ children }) {
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState('HL-2026-8941');
  const [activeCase, setActiveCase] = useState(null);
  const [currentView, setCurrentView] = useState('matrix');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [health, setHealth] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // Fetch health and initial case list
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthData, casesData] = await Promise.all([
        api.getHealth().catch(e => ({ status: 'error', llm_configured: false })),
        api.getCases(),
      ]);
      setHealth(healthData);
      setCases(casesData);

      if (casesData.length > 0) {
        const found = casesData.find(c => c.id === activeCaseId) || casesData[0];
        setActiveCaseId(found.id);
        const detail = await api.getCase(found.id);
        setActiveCase(detail);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError(err.message || 'Unable to connect to Northgate Document Chaser Copilot API.');
    } finally {
      setLoading(false);
    }
  }, [activeCaseId]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload current case details
  const refreshActiveCase = useCallback(async (caseIdToLoad = activeCaseId) => {
    try {
      const detail = await api.getCase(caseIdToLoad);
      setActiveCase(detail);
      // Also update cases list in background
      api.getCases().then(setCases).catch(console.error);
      return detail;
    } catch (err) {
      console.error('Failed to refresh case:', err);
      showToast(`Error refreshing case: ${err.message}`);
      throw err;
    }
  }, [activeCaseId, showToast]);

  // Switch active case
  const switchCase = useCallback(async (newCaseId) => {
    setLoading(true);
    setError(null);
    try {
      setActiveCaseId(newCaseId);
      const detail = await api.getCase(newCaseId);
      setActiveCase(detail);
    } catch (err) {
      console.error('Failed to switch case:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset database demo
  const resetDemo = useCallback(async () => {
    setLoading(true);
    try {
      await api.resetDatabase();
      showToast('Database reset to pristine demo state.');
      await loadInitialData();
    } catch (err) {
      showToast(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [loadInitialData, showToast]);

  const value = {
    cases,
    activeCaseId,
    activeCase,
    setActiveCase,
    currentView,
    setCurrentView,
    loading,
    setLoading,
    error,
    setError,
    health,
    refreshActiveCase,
    switchCase,
    resetDemo,
    isAuditModalOpen,
    setIsAuditModalOpen,
    toastMessage,
    showToast,
  };

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
}

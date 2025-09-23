import React, { createContext, useContext, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsContextType {
  trackPageVisit: (page?: string) => void;
  trackAction: (actionName: string, additionalData?: Record<string, any>) => void;
  trackApiCall: (endpoint: string, method: string, additionalData?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const analytics = useAnalytics();

  // Track app initialization
  useEffect(() => {
    analytics.trackAction('app_initialized', {
      app_version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  }, [analytics]);

  // Track visibility changes (user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      analytics.trackAction(document.hidden ? 'page_hidden' : 'page_visible', {
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [analytics]);

  // Track page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      analytics.trackAction('page_unload', {
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [analytics]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};
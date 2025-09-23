import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface ActivityData {
  activity_type: 'page_visit' | 'action' | 'api_call';
  page_url?: string;
  action_name?: string;
  additional_data?: Record<string, any>;
}

interface AnalyticsHook {
  trackPageVisit: (page?: string) => void;
  trackAction: (actionName: string, additionalData?: Record<string, any>) => void;
  trackApiCall: (endpoint: string, method: string, additionalData?: Record<string, any>) => void;
}

const API_BASE_URL = 'http://localhost:8000/api';

async function sendAnalytics(data: ActivityData): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/track-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include httpOnly cookies
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Silently fail analytics tracking - don't disrupt user experience
    console.debug('Analytics tracking failed:', error);
  }
}

function getDeviceInfo() {
  return {
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    device_pixel_ratio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    user_agent: navigator.userAgent,
  };
}

export const useAnalytics = (): AnalyticsHook => {
  const location = useLocation();

  // Track page visits automatically
  useEffect(() => {
    const trackPageVisit = () => {
      const deviceInfo = getDeviceInfo();

      sendAnalytics({
        activity_type: 'page_visit',
        page_url: location.pathname + location.search,
        additional_data: {
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
          ...deviceInfo,
        },
      });
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(trackPageVisit, 100);
    return () => clearTimeout(timer);
  }, [location]);

  // Track user actions
  const trackAction = useCallback((actionName: string, additionalData?: Record<string, any>) => {
    sendAnalytics({
      activity_type: 'action',
      page_url: location.pathname + location.search,
      action_name: actionName,
      additional_data: {
        timestamp: new Date().toISOString(),
        ...getDeviceInfo(),
        ...additionalData,
      },
    });
  }, [location]);

  // Track API calls
  const trackApiCall = useCallback((endpoint: string, method: string, additionalData?: Record<string, any>) => {
    sendAnalytics({
      activity_type: 'api_call',
      page_url: location.pathname + location.search,
      action_name: `${method.toUpperCase()} ${endpoint}`,
      additional_data: {
        endpoint,
        method: method.toUpperCase(),
        timestamp: new Date().toISOString(),
        ...additionalData,
      },
    });
  }, [location]);

  // Manual page visit tracking (if needed to override automatic)
  const trackPageVisit = useCallback((page?: string) => {
    const deviceInfo = getDeviceInfo();

    sendAnalytics({
      activity_type: 'page_visit',
      page_url: page || (location.pathname + location.search),
      additional_data: {
        manual_track: true,
        timestamp: new Date().toISOString(),
        ...deviceInfo,
      },
    });
  }, [location]);

  return {
    trackPageVisit,
    trackAction,
    trackApiCall,
  };
};

// Enhanced hook for component-level tracking
export const useComponentAnalytics = (componentName: string) => {
  const { trackAction } = useAnalytics();

  const trackComponentAction = useCallback((action: string, data?: Record<string, any>) => {
    trackAction(`${componentName}:${action}`, {
      component: componentName,
      ...data,
    });
  }, [componentName, trackAction]);

  return {
    trackComponentAction,
  };
};

// Hook for form tracking
export const useFormAnalytics = (formName: string) => {
  const { trackAction } = useAnalytics();

  const trackFormStart = useCallback(() => {
    trackAction('form_start', { form_name: formName });
  }, [formName, trackAction]);

  const trackFormSubmit = useCallback((success: boolean, data?: Record<string, any>) => {
    trackAction('form_submit', {
      form_name: formName,
      success,
      ...data,
    });
  }, [formName, trackAction]);

  const trackFormError = useCallback((error: string, field?: string) => {
    trackAction('form_error', {
      form_name: formName,
      error,
      field,
    });
  }, [formName, trackAction]);

  const trackFieldFocus = useCallback((fieldName: string) => {
    trackAction('field_focus', {
      form_name: formName,
      field_name: fieldName,
    });
  }, [formName, trackAction]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackFieldFocus,
  };
};
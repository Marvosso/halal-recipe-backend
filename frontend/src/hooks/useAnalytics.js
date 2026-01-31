import { useCallback } from "react";
import logger from "../utils/logger";

/**
 * Analytics hook placeholder
 * Currently logs events in development only
 * Ready for integration with analytics services (Google Analytics, Meta, etc.)
 */
export function useAnalytics() {
  const trackEvent = useCallback((eventName, eventData = {}) => {
    // In development, log for debugging
    logger.debug("[Analytics]", eventName, eventData);

    // TODO: When ready to activate analytics:
    // - Uncomment and configure Google Analytics
    // - Uncomment and configure Meta Pixel
    // - Add other analytics services as needed

    // Example Google Analytics integration (disabled):
    // if (window.gtag) {
    //   window.gtag('event', eventName, eventData);
    // }

    // Example Meta Pixel integration (disabled):
    // if (window.fbq) {
    //   window.fbq('track', eventName, eventData);
    // }
  }, []);

  const trackPageView = useCallback((pageName) => {
    trackEvent("page_view", { page: pageName });
  }, [trackEvent]);

  const trackConversion = useCallback((data) => {
    trackEvent("recipe_conversion", {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }, [trackEvent]);

  const trackQuickLookup = useCallback((ingredient) => {
    trackEvent("quick_lookup", {
      ingredient,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackQuickLookup,
  };
}

export default useAnalytics;

import { useState, useEffect, useMemo } from "react";
import { fetchAffiliateLinksBySubstitute } from "../lib/monetization";
import { detectUserRegion } from "../lib/regionDetection";

/**
 * Loads affiliate links after the main UI has painted (idle / short delay).
 * Does not block lookup API calls.
 *
 * @param {string[]} substituteSlugs
 * @param {{ enabled?: boolean }} [options]
 */
export function useDeferredAffiliateLinks(substituteSlugs, options = {}) {
  const { enabled = true } = options;
  const slugKey = useMemo(
    () => (substituteSlugs || []).filter(Boolean).join(","),
    [substituteSlugs]
  );

  const [linksBySlug, setLinksBySlug] = useState(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!enabled || !slugKey) {
      setLinksBySlug(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      try {
        const region = await detectUserRegion();
        const map = await fetchAffiliateLinksBySubstitute(
          slugKey.split(","),
          region.countryCode || "US"
        );
        if (!cancelled) {
          setLinksBySlug(map);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setLinksBySlug({});
          setStatus("error");
        }
      }
    };

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => load(), { timeout: 2500 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(load, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slugKey, enabled]);

  return { linksBySlug, status, isLoading: status === "loading" };
}

import { useState, useCallback, useRef } from "react";
import { performCanonicalLookup } from "../lib/lookup/canonicalLookup";

/**
 * Quick Lookup hook — canonical POST /api/lookup only (Phase 1).
 * No client halalEngine fallback (avoids verdict drift).
 *
 * @returns {{
 *   result: object|null,
 *   isLoading: boolean,
 *   error: object|null,
 *   lookup: (query: string, options?: object) => Promise<void>,
 *   reset: () => void,
 * }}
 */
export function useIngredientLookup() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const lookup = useCallback(async (query, options = {}) => {
    const trimmed = (query || "").trim();
    if (!trimmed) {
      reset();
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const { result: nextResult, error: nextError } = await performCanonicalLookup(
        trimmed,
        {
          source: options.source || "typed",
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;

      setResult(nextResult);
      setError(nextError);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError({
        code: "lookup_failed",
        message: err.message || "Could not evaluate this ingredient.",
      });
      setResult(null);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [reset]);

  return { result, isLoading, error, lookup, reset };
}

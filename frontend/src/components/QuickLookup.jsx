import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useIngredientLookup } from "../hooks/useIngredientLookup";
import { addRecentLookup, getRecentLookups } from "../lib/recentLookupsStorage";
import QuickLookupSearch from "./lookup/QuickLookupSearch";
import IngredientVerdictCard from "./lookup/IngredientVerdictCard";
import {
  QuickLookupLoading,
  QuickLookupError,
  QuickLookupEmptyHint,
} from "./lookup/QuickLookupStates";
import ContextualAd from "./ContextualAd";
import ContextualSubstituteRecommendations from "./monetization/ContextualSubstituteRecommendations";
import { isContextualAdsEnabled } from "../lib/monetization";
import ShareResultModal from "./share/ShareResultModal";
import { buildIngredientShareData } from "../lib/shareCards/buildIngredientShareData";
import "./QuickLookup.css";

/**
 * Quick ingredient lookup — mobile-first, server-backed when available.
 * @param {object} props
 * @param {function} [props.onConvertClick]
 * @param {string} [props.initialSearch]
 * @param {boolean} [props.autoSearchOnMount]
 * @param {"default"|"grocery"|"embedded"} [props.variant]
 * @param {string} [props.lookupSource] - API source hint (e.g. "seo")
 */
function QuickLookup({
  onConvertClick,
  initialSearch = "",
  autoSearchOnMount = false,
  variant = "default",
  lookupSource = "typed",
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch || "");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentLookups, setRecentLookups] = useState(() => getRecentLookups());

  const { result, isLoading, error, lookup, reset } = useIngredientLookup();
  const compact = variant === "grocery" || variant === "embedded";
  const [showShareModal, setShowShareModal] = useState(false);

  const ingredientShareData = useMemo(
    () => (result ? buildIngredientShareData(result, searchTerm) : null),
    [result, searchTerm]
  );

  const runLookup = useCallback(
    async (term) => {
      const q = (term ?? searchTerm).trim();
      if (!q) {
        reset();
        return;
      }
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
      await lookup(q, { source: lookupSource });
      addRecentLookup(q);
      setRecentLookups(getRecentLookups());
    },
    [searchTerm, lookup, reset]
  );

  useEffect(() => {
    const handlePrefill = (e) => {
      const ingredient = e.detail?.ingredient;
      if (ingredient) {
        setSearchTerm(ingredient);
        setTimeout(() => runLookup(ingredient), 80);
      }
    };
    window.addEventListener("prefillQuickLookup", handlePrefill);
    return () => window.removeEventListener("prefillQuickLookup", handlePrefill);
  }, [runLookup]);

  useEffect(() => {
    if (autoSearchOnMount && initialSearch?.trim()) {
      runLookup(initialSearch.trim());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setSearchTerm("");
    reset();
    setSuggestionsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleTermChange = (value) => {
    setSearchTerm(value);
    setSuggestionsOpen(true);
    setHighlightedIndex(-1);
    if (!value.trim()) reset();
  };

  return (
    <section
      className={`quick-lookup quick-lookup--${variant}`}
      aria-labelledby="quick-lookup-title"
    >
      <header className="quick-lookup__header">
        <h3 id="quick-lookup-title">Is it halal?</h3>
        <p className="quick-lookup__subtitle">
          {variant === "grocery"
            ? "Snap or type any ingredient from a label"
            : "Fast ingredient check — type and tap Check"}
        </p>
      </header>

      <div className="quick-lookup__search-sticky">
        <QuickLookupSearch
          searchTerm={searchTerm}
          onSearchTermChange={handleTermChange}
          onSearch={() => runLookup()}
          onClear={handleClear}
          onSelectSuggestion={(item) => {
            setSearchTerm(item);
            runLookup(item);
          }}
          isLoading={isLoading}
          suggestionsOpen={suggestionsOpen}
          onSuggestionsOpenChange={setSuggestionsOpen}
          highlightedIndex={highlightedIndex}
          onHighlightedIndexChange={setHighlightedIndex}
        />
      </div>

      {!result && !isLoading && !error && <QuickLookupEmptyHint />}

      {recentLookups.length > 0 && !result && !isLoading && (
        <div className="quick-lookup__recent" aria-label="Recent lookups">
          <span className="quick-lookup__recent-label">Recent</span>
          <div className="quick-lookup__recent-list">
            {recentLookups.map((term, idx) => (
              <button
                key={`${term}-${idx}`}
                type="button"
                className="quick-lookup__recent-chip"
                onClick={() => {
                  setSearchTerm(term);
                  runLookup(term);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="quick-lookup__results"
        aria-live="polite"
        aria-atomic="true"
      >
        {isLoading && <QuickLookupLoading compact={compact} />}
        {error && !isLoading && (
          <QuickLookupError
            error={error}
            onRetry={() => runLookup()}
          />
        )}
        {result && !isLoading && (
          <IngredientVerdictCard
            result={result}
            query={searchTerm}
            compact={compact}
            onConvertClick={onConvertClick}
            onShareClick={() => setShowShareModal(true)}
          />
        )}
      </div>

      {result && !isLoading && (
        <ContextualSubstituteRecommendations result={result} context="lookup" />
      )}

      {result && isContextualAdsEnabled() && (
        <ContextualAd placement="ingredient_lookup" className="quick-lookup-ad" />
      )}

      <ShareResultModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cardType="ingredient"
        data={ingredientShareData}
      />
    </section>
  );
}

export default QuickLookup;

import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { getFilteredSuggestions } from "../../lib/ingredientSuggestions";
import "./QuickLookupSearch.css";

/**
 * Mobile-first search bar with autocomplete.
 */
function QuickLookupSearch({
  searchTerm,
  onSearchTermChange,
  onSearch,
  onClear,
  onSelectSuggestion,
  isLoading,
  suggestionsOpen,
  onSuggestionsOpenChange,
  highlightedIndex,
  onHighlightedIndexChange,
  inputId = "quick-lookup-input",
}) {
  const suggestionsRef = useRef(null);
  const blurTimeoutRef = useRef(null);
  const suggestions = getFilteredSuggestions(searchTerm, { limit: 16 });
  const showSuggestions = suggestionsOpen && suggestions.length > 0;

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (highlightedIndex >= suggestions.length) {
      onHighlightedIndexChange(Math.max(0, suggestions.length - 1));
    }
  }, [suggestions.length, highlightedIndex, onHighlightedIndexChange]);

  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSearch();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onHighlightedIndexChange(
        highlightedIndex < suggestions.length - 1 ? highlightedIndex + 1 : 0
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onHighlightedIndexChange(
        highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1
      );
      return;
    }
    if (e.key === "Enter" && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      e.preventDefault();
      onSelectSuggestion(suggestions[highlightedIndex]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onSuggestionsOpenChange(false);
      onHighlightedIndexChange(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch();
    }
  };

  return (
    <div className="ql-search">
      <div className="ql-search__bar">
        <label htmlFor={inputId} className="ql-search__label">
          Ingredient name
        </label>
        <div className="ql-search__input-wrap">
          <Search className="ql-search__search-icon" size={20} aria-hidden />
          <input
            id={inputId}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="e.g. pork gelatin, soy sauce"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onFocus={() => {
              onSuggestionsOpenChange(true);
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(() => {
                onSuggestionsOpenChange(false);
                onHighlightedIndexChange(-1);
              }, 180);
            }}
            onKeyDown={handleKeyDown}
            className={`ql-search__input ${showSuggestions ? "ql-search__input--open" : ""}`}
            aria-label="Search ingredient"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="ingredient-suggestions-list"
            aria-activedescendant={
              highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
            }
            aria-describedby="quick-lookup-hint"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={onClear}
              className="ql-search__clear"
              aria-label="Clear search"
            >
              <X size={18} aria-hidden />
            </button>
          )}
          {showSuggestions && (
            <ul
              id="ingredient-suggestions-list"
              className="ql-search__suggestions"
              role="listbox"
              ref={suggestionsRef}
            >
              {!searchTerm.trim() && (
                <li className="ql-search__suggestions-heading" role="presentation">
                  Popular lookups
                </li>
              )}
              {suggestions.map((item, index) => (
                <li
                  key={item}
                  id={`suggestion-${index}`}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`ql-search__suggestion ${
                    index === highlightedIndex ? "ql-search__suggestion--active" : ""
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectSuggestion(item);
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="ql-search__submit"
          disabled={isLoading || !searchTerm.trim()}
          aria-label={isLoading ? "Searching" : "Search ingredient"}
        >
          {isLoading ? (
            <span className="ql-search__submit-text">…</span>
          ) : (
            <>
              <Search size={18} aria-hidden />
              <span className="ql-search__submit-text">Check</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default QuickLookupSearch;

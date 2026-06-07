"use client";

import { SearchActiveBar } from "./search-active-bar";
import { SearchRefinePanel } from "./search-refine-panel";
import { SearchSuggestions } from "./search-suggestions";

export function SearchResultsChrome({
  resultCount,
  nearbyCount = 0,
  showingFallback = false,
  currentHref,
  currentLabel,
  showEmptySuggestions = false,
  hideSuggestions = false,
  children,
}: {
  resultCount: number;
  nearbyCount?: number;
  showingFallback?: boolean;
  currentHref?: string;
  currentLabel?: string;
  showEmptySuggestions?: boolean;
  hideSuggestions?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <SearchActiveBar
        resultCount={resultCount}
        nearbyCount={nearbyCount}
        showingFallback={showingFallback}
        currentHref={currentHref}
        currentLabel={currentLabel}
        compact
      />

      <SearchRefinePanel defaultOpen={false} />

      {children}

      {!hideSuggestions ? (
        <SearchSuggestions variant={showEmptySuggestions ? "empty" : "footer"} />
      ) : null}
    </>
  );
}

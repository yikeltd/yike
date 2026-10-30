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
  filtersDefaultOpen = true,
  refinePanelClassName = "mt-1",
  children,
}: {
  resultCount: number;
  nearbyCount?: number;
  showingFallback?: boolean;
  currentHref?: string;
  currentLabel?: string;
  showEmptySuggestions?: boolean;
  hideSuggestions?: boolean;
  filtersDefaultOpen?: boolean;
  refinePanelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SearchRefinePanel
        defaultOpen={filtersDefaultOpen}
        className={refinePanelClassName}
      />

      <SearchActiveBar
        resultCount={resultCount}
        nearbyCount={nearbyCount}
        showingFallback={showingFallback}
        currentHref={currentHref}
        currentLabel={currentLabel}
        compact
      />

      {children}

      {!hideSuggestions ? (
        <SearchSuggestions variant={showEmptySuggestions ? "empty" : "footer"} />
      ) : null}
    </>
  );
}

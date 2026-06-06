"use client";

import { SearchActiveBar } from "./search-active-bar";
import { SearchRefinePanel } from "./search-refine-panel";
import { SearchSuggestions } from "./search-suggestions";

export function SearchResultsChrome({
  resultCount,
  currentHref,
  currentLabel,
  showEmptySuggestions = false,
  children,
}: {
  resultCount: number;
  currentHref?: string;
  currentLabel?: string;
  showEmptySuggestions?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <SearchActiveBar
        resultCount={resultCount}
        currentHref={currentHref}
        currentLabel={currentLabel}
        compact
      />

      <SearchRefinePanel defaultOpen={false} />

      {children}

      <SearchSuggestions variant={showEmptySuggestions ? "empty" : "footer"} />
    </>
  );
}

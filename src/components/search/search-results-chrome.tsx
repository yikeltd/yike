"use client";

import { SearchActiveBar } from "./search-active-bar";
import { SearchRefinePanel } from "./search-refine-panel";

export function SearchResultsChrome({
  resultCount,
  currentHref,
  currentLabel,
  children,
}: {
  resultCount: number;
  currentHref?: string;
  currentLabel?: string;
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
    </>
  );
}

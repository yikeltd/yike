"use client";

import { ElectronicsRefinePanel } from "./electronics-refine-panel";
import { ElectronicsActiveBar } from "./electronics-active-bar";

export function ElectronicsSearchResultsChrome({
  resultCount,
  filtersDefaultOpen = false,
  children,
}: {
  resultCount: number;
  filtersDefaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <ElectronicsRefinePanel defaultOpen={filtersDefaultOpen} className="mt-1" />
      <ElectronicsActiveBar resultCount={resultCount} compact />
      {children}
    </>
  );
}

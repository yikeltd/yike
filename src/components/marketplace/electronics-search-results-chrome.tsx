"use client";

import { ElectronicsRefinePanel } from "./electronics-refine-panel";
import { ElectronicsActiveBar } from "./electronics-active-bar";

export function ElectronicsSearchResultsChrome({
  resultCount,
  filtersDefaultOpen = false,
  refinePanelClassName = "mt-1",
  children,
}: {
  resultCount: number;
  filtersDefaultOpen?: boolean;
  refinePanelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ElectronicsRefinePanel
        defaultOpen={filtersDefaultOpen}
        className={refinePanelClassName}
      />
      <ElectronicsActiveBar resultCount={resultCount} compact />
      {children}
    </>
  );
}

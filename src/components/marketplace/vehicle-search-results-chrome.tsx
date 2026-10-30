"use client";

import { VehicleRefinePanel } from "./vehicle-refine-panel";
import { VehicleActiveBar } from "./vehicle-active-bar";

/** Mirrors property SearchResultsChrome for vehicle browse. */
export function VehicleSearchResultsChrome({
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
      <VehicleRefinePanel
        defaultOpen={filtersDefaultOpen}
        className={refinePanelClassName}
      />
      <VehicleActiveBar resultCount={resultCount} compact />
      {children}
    </>
  );
}

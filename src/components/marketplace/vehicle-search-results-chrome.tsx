"use client";

import { VehicleRefinePanel } from "./vehicle-refine-panel";
import { VehicleActiveBar } from "./vehicle-active-bar";

/** Mirrors property SearchResultsChrome for vehicle browse. */
export function VehicleSearchResultsChrome({
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
      <VehicleRefinePanel defaultOpen={filtersDefaultOpen} className="mt-1" />
      <VehicleActiveBar resultCount={resultCount} compact />
      {children}
    </>
  );
}

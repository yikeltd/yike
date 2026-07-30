"use client";

import { useState } from "react";
import { LayoutGrid, Map, Bookmark } from "lucide-react";
import type { Property } from "@/types/database";
import { cn } from "@/lib/utils";
import { SearchActiveBar } from "./search-active-bar";
import { MapSearchView } from "./map-search-view";
import { SavedSearchesManager } from "./saved-searches-manager";

export function SearchClientChrome({
  feedItems,
  exactCount,
  nearbyCount = 0,
  showingFallback = false,
  currentHref,
  currentLabel,
  children,
}: {
  feedItems: Property[];
  exactCount: number;
  nearbyCount?: number;
  showingFallback?: boolean;
  currentHref?: string;
  currentLabel?: string;
  children: React.ReactNode;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);

  return (
    <>
      {/* ACTION TOOLBAR: GRID vs MAP VIEW TOGGLE & SAVE SEARCH */}
      <div className="flex items-center justify-between px-3 pt-3 lg:px-6 xl:px-8">
        <SearchActiveBar
          resultCount={exactCount}
          nearbyCount={nearbyCount}
          showingFallback={showingFallback}
          currentHref={currentHref}
          currentLabel={currentLabel}
          compact
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSavedDrawerOpen(true)}
            className="pressable inline-flex items-center gap-1.5 rounded-2xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy px-3 py-1.5 text-xs font-black text-navy dark:text-white shadow-xs hover:border-gold/40"
          >
            <Bookmark className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">Save Search</span>
          </button>

          <div className="flex rounded-2xl bg-slate-200 dark:bg-navy-light p-0.5 border border-navy/10 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "pressable flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition-all",
                viewMode === "grid"
                  ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy shadow-sm"
                  : "text-navy/60 dark:text-white/60 hover:text-navy"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={cn(
                "pressable flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold transition-all",
                viewMode === "map"
                  ? "bg-[#031B4E] dark:bg-gold text-white dark:text-navy shadow-sm"
                  : "text-navy/60 dark:text-white/60 hover:text-navy"
              )}
            >
              <Map className="h-3.5 w-3.5 text-gold" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW RENDER: MAP VIEW vs GRID VIEW */}
      {viewMode === "map" ? (
        <div className="px-3 pt-3 lg:px-6 xl:px-8">
          <MapSearchView
            items={feedItems}
            onCloseMap={() => setViewMode("grid")}
          />
        </div>
      ) : (
        children
      )}

      {/* SAVED SEARCHES DRAWER */}
      {savedDrawerOpen && (
        <SavedSearchesManager
          currentSearchHref={currentHref}
          currentSearchTitle={currentLabel}
          isOpen={savedDrawerOpen}
          onClose={() => setSavedDrawerOpen(false)}
        />
      )}
    </>
  );
}

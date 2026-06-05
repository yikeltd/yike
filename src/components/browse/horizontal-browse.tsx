"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { Property } from "@/types/database";
import {
  getBrowsePreferences,
  rankPropertiesForBrowse,
  syncBrowseFromRecentSearches,
} from "@/lib/browse-preferences";
import { BrowseSlide } from "./browse-slide";

export function HorizontalBrowse({ properties }: { properties: Property[] }) {
  const [index, setIndex] = useState(0);
  const [feed, setFeed] = useState(properties);
  const touchStart = useRef(0);

  useEffect(() => {
    syncBrowseFromRecentSearches();
    const prefs = getBrowsePreferences();
    setFeed(rankPropertiesForBrowse(properties, prefs));
    setIndex(0);
  }, [properties]);

  const count = feed.length;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  if (count === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-navy-dark px-6 text-center">
        <p className="text-lg font-bold text-white">No homes match yet</p>
        <p className="text-sm text-white/70">
          Apply filters on the home page — swipe picks up what you search for.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy"
        >
          Browse on home
        </Link>
      </div>
    );
  }

  const current = feed[index];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-navy-dark">
      <Link
        href="/"
        className="pressable absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex items-center gap-1.5 rounded-full bg-navy/80 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <span className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
        {index + 1} / {count}
      </span>

      <div
        className="h-full w-full touch-pan-y"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) < 40) return;
          go(diff > 0 ? 1 : -1);
        }}
      >
        <BrowseSlide
          key={current.id}
          property={current}
          priority
          showSwipeHint={count > 1}
          horizontal
        />
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="pressable absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/35 p-3 text-white backdrop-blur-sm"
            aria-label="Previous home"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="pressable absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/35 p-3 text-white backdrop-blur-sm"
            aria-label="Next home"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

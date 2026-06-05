"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import type { Property } from "@/types/database";
import {
  getBrowsePreferences,
  rankPropertiesForBrowse,
  syncBrowseFromRecentSearches,
  trackViewedListing,
} from "@/lib/browse-preferences";
import { BrowseSlide } from "./browse-slide";

export function HorizontalBrowse({ properties }: { properties: Property[] }) {
  const [index, setIndex] = useState(0);
  const [feed, setFeed] = useState(properties);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const touchStart = useRef(0);

  useEffect(() => {
    syncBrowseFromRecentSearches();
    const prefs = getBrowsePreferences();
    const ranked = rankPropertiesForBrowse(properties, prefs);
    setFeed(ranked);
    setIndex(0);
  }, [properties]);

  const visible = feed.filter((p) => !skipped.has(p.id));
  const count = visible.length;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  const skip = useCallback(() => {
    const current = visible[index];
    if (!current) return;
    trackViewedListing(current.id);
    setSkipped((prev) => {
      const next = new Set(prev).add(current.id);
      const remaining = feed.filter((p) => !next.has(p.id)).length;
      setIndex((i) => Math.min(i, Math.max(0, remaining - 1)));
      return next;
    });
  }, [visible, index, feed]);

  const save = useCallback(() => {
    const current = visible[index];
    if (!current) return;
    try {
      const raw = JSON.parse(
        localStorage.getItem("yike_guest_favorites") ?? "[]"
      ) as string[];
      if (!raw.includes(current.id)) {
        localStorage.setItem(
          "yike_guest_favorites",
          JSON.stringify([current.id, ...raw].slice(0, 50))
        );
      }
    } catch {
      /* ignore */
    }
    go(1);
  }, [visible, index, go]);

  if (count === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-navy-dark px-6 text-center">
        <p className="text-lg font-bold text-white">No homes match yet</p>
        <p className="text-sm text-white/70">
          Search on the home page — swipe picks up your city, area, and budget.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const current = visible[index];

  useEffect(() => {
    if (current) trackViewedListing(current.id);
  }, [current?.id]);

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
          if (Math.abs(diff) < 50) return;
          if (diff > 0) skip();
          else save();
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

      <div className="absolute bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-0 right-0 z-30 flex justify-center gap-3 px-4 lg:hidden">
        <button
          type="button"
          onClick={skip}
          className="pressable flex h-12 min-w-[100px] items-center justify-center gap-1.5 rounded-full bg-white/15 text-sm font-bold text-white backdrop-blur-md"
        >
          <X className="h-4 w-4" />
          Skip
        </button>
        <button
          type="button"
          onClick={save}
          className="pressable flex h-12 min-w-[100px] items-center justify-center gap-1.5 rounded-full bg-gold text-sm font-bold text-navy"
        >
          <Heart className="h-4 w-4" />
          Save
        </button>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="pressable absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/35 p-3 text-white backdrop-blur-sm lg:flex"
            aria-label="Previous home"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="pressable absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/35 p-3 text-white backdrop-blur-sm lg:flex"
            aria-label="Next home"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

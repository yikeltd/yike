"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Property } from "@/types/database";
import {
  getBrowsePreferences,
  rankPropertiesForBrowse,
  syncBrowseFromRecentSearches,
  trackViewedListing,
  trackSavedListing,
} from "@/lib/browse-preferences";
import { BrowseSlide } from "./browse-slide";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { recordEngagementSave } from "@/lib/engagement";
import { cn } from "@/lib/utils";

type SwipeDir = "left" | "right" | null;

export function HorizontalBrowse({ properties }: { properties: Property[] }) {
  const { guardAction } = useAuth();
  const [feed, setFeed] = useState(properties);
  const [index, setIndex] = useState(0);
  const [exitDir, setExitDir] = useState<SwipeDir>(null);
  const touchStart = useRef(0);
  const animating = useRef(false);

  useEffect(() => {
    syncBrowseFromRecentSearches();
    const prefs = getBrowsePreferences();
    const ranked = rankPropertiesForBrowse(properties, prefs);
    setFeed(ranked.length > 0 ? ranked : properties);
    setIndex(0);
  }, [properties]);

  const count = feed.length;
  const current = feed[index % count];

  const advance = useCallback(
    (dir: SwipeDir) => {
      if (animating.current || count === 0) return;
      animating.current = true;
      setExitDir(dir);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % count);
        setExitDir(null);
        animating.current = false;
      }, 320);
    },
    [count]
  );

  const skip = useCallback(() => {
    if (!current) return;
    trackViewedListing(current.id);
    advance("left");
  }, [current, advance]);

  const save = useCallback(() => {
    if (!current) return;
    guardAction(
      {
        type: "save",
        listingId: current.id,
        redirectPath: "/browse",
      },
      async () => {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("favorites").upsert(
              { user_id: user.id, property_id: current.id },
              { onConflict: "user_id,property_id", ignoreDuplicates: true }
            );
            recordEngagementSave();
          }
        }
        trackViewedListing(current.id);
        trackSavedListing(current.id);
        advance("right");
      }
    );
  }, [current, guardAction, advance]);

  useEffect(() => {
    if (current) trackViewedListing(current.id);
  }, [current?.id]);

  if (count === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-navy-dark px-6 text-center">
        <p className="text-lg font-bold text-white">No homes match yet</p>
        <p className="text-sm text-white/70">
          Filter on the home page — swipe learns your city, area, and budget.
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

  const next = feed[(index + 1) % count];

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
        {(index % count) + 1} / {count}
      </span>

      <div className="relative h-full w-full">
        {next && (
          <div className="absolute inset-0 z-0 scale-[0.96] opacity-40">
            <BrowseSlide property={next} horizontal />
          </div>
        )}
        <div
          className={cn(
            "relative z-10 h-full w-full touch-pan-y transition-transform",
            exitDir === "left" && "swipe-exit-left",
            exitDir === "right" && "swipe-exit-right"
          )}
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
      </div>

    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Property } from "@/types/database";
import { buildBalancedBrowseFeed } from "@/lib/browse-feed";
import {
  getBrowsePreferences,
  syncBrowseFromRecentSearches,
  trackNotInterestedListing,
  trackViewedListing,
  type NotInterestedReason,
} from "@/lib/browse-preferences";
import { BrowseSlide } from "./browse-slide";
import { cn } from "@/lib/utils";
import {
  continueBrowsingHint,
  getSwipeMemory,
  resolveSwipeResumeIndex,
  saveSwipeMemory,
} from "@/lib/swipe/memory";
import { preloadUpcomingSwipeCards } from "@/lib/swipe/preload";
import { recordSwipePace, recordCardDwell } from "@/lib/swipe/motion-timing";
import { motionEnabled } from "@/lib/swipe/low-data";
import {
  trackSwipeSkip,
  trackSwipeNotInterested,
  trackSwipeDwell,
  trackSwipeExit,
} from "@/lib/swipe/analytics";

type SwipeDir = "left" | "right" | null;

export function HorizontalBrowse({ properties }: { properties: Property[] }) {
  const [feed, setFeed] = useState(properties);
  const [index, setIndex] = useState(0);
  const [exitDir, setExitDir] = useState<SwipeDir>(null);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const touchStart = useRef(0);
  const animating = useRef(false);
  const cardEnteredAt = useRef(Date.now());
  const lowData = !motionEnabled();

  useEffect(() => {
    syncBrowseFromRecentSearches();
    const prefs = getBrowsePreferences();
    const balanced = buildBalancedBrowseFeed(properties, prefs, 80);
    const nextFeed = balanced.length > 0 ? balanced : properties;
    setFeed(nextFeed);

    const memory = getSwipeMemory();
    setResumeHint(continueBrowsingHint(memory));
    setIndex(resolveSwipeResumeIndex(nextFeed.map((p) => p.id), memory));
  }, [properties]);

  const count = feed.length;
  const current = count > 0 ? feed[index % count] : undefined;

  useEffect(() => {
    if (count === 0) return;
    preloadUpcomingSwipeCards(feed, index);
  }, [feed, index, count]);

  useEffect(() => {
    if (!current) return;
    cardEnteredAt.current = Date.now();
    saveSwipeMemory({
      listingId: current.id,
      index: index % count,
      city: current.city,
      area: current.area,
      propertyType: current.property_type,
      price: Number(current.price),
    });

    return () => {
      const dwell = Date.now() - cardEnteredAt.current;
      if (dwell > 600) {
        recordCardDwell(dwell);
        trackSwipeDwell({
          listing_id: current.id,
          city: current.city,
          area: current.area,
          dwell_ms: dwell,
        });
      }
    };
  }, [current, index, count]);

  useEffect(() => {
    return () => {
      if (!current) return;
      trackSwipeExit({
        listing_id: current.id,
        city: current.city,
        dwell_ms: Date.now() - cardEnteredAt.current,
      });
    };
  }, [current?.id]);

  const advance = useCallback(
    (dir: SwipeDir) => {
      if (animating.current || count === 0) return;
      recordSwipePace();
      animating.current = true;
      setExitDir(dir);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % count);
        setExitDir(null);
        animating.current = false;
        setResumeHint(null);
      }, 320);
    },
    [count]
  );

  const skip = useCallback(() => {
    if (!current) return;
    trackSwipeSkip({
      listing_id: current.id,
      city: current.city,
      area: current.area,
      direction: "left",
    });
    trackViewedListing(current.id, {
      city: current.city,
      area: current.area,
      listingType: current.listing_type,
      propertyType: current.property_type,
    });
    advance("left");
  }, [current, advance]);

  const handleNotInterested = useCallback(
    (property: Property, reason: NotInterestedReason) => {
      trackNotInterestedListing(
        property.id,
        {
          city: property.city,
          area: property.area,
          listingType: property.listing_type,
          propertyType: property.property_type,
          price: Number(property.price),
        },
        reason
      );
      trackSwipeNotInterested({
        listing_id: property.id,
        city: property.city,
        area: property.area,
        reason,
      });
      setFeed((prev) => prev.filter((p) => p.id !== property.id));
      recordSwipePace();
    },
    []
  );

  useEffect(() => {
    if (!current) return;
    trackViewedListing(current.id, {
      city: current.city,
      area: current.area,
      listingType: current.listing_type,
      propertyType: current.property_type,
    });
  }, [current]);

  if (count === 0 || !current) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-navy-dark px-6 text-center">
        <p className="text-lg font-bold text-white">No homes match yet</p>
        <p className="text-sm text-white/70">
          Try a nearby area or another property type — we&apos;ll learn your picks as you browse.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/search?city=Lagos&area=Lekki"
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Lekki
          </Link>
          <Link
            href="/search?city=Abuja&area=Gwarinpa"
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Gwarinpa
          </Link>
          <Link
            href="/search?listingType=rent"
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Rentals
          </Link>
        </div>
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

      {resumeHint && (
        <p className="pointer-events-none absolute left-1/2 top-[max(2.75rem,env(safe-area-inset-top))] z-30 max-w-[90%] -translate-x-1/2 truncate text-center text-[10px] font-semibold text-white/75">
          {resumeHint}
        </p>
      )}

      <div className="relative h-full w-full">
        {next && (
          <div className="absolute inset-0 z-0 scale-[0.96] opacity-35 blur-[0.3px]">
            <BrowseSlide property={next} horizontal isActive={false} motionEnabled={false} />
          </div>
        )}
        <div
          className={cn(
            "swipe-card-active relative z-10 h-full w-full touch-pan-y",
            exitDir === "left" && "swipe-exit-left",
            exitDir === "right" && "swipe-exit-right"
          )}
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const diff = touchStart.current - e.changedTouches[0].clientX;
            if (Math.abs(diff) < 50) return;
            skip();
          }}
        >
          <BrowseSlide
            key={current.id}
            property={current}
            priority
            showSwipeHint={count > 1 && index === 0}
            horizontal
            isActive
            motionEnabled={!lowData}
            onNotInterested={handleNotInterested}
          />
        </div>
      </div>
    </div>
  );
}

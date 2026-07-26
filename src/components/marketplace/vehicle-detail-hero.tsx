"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import {
  VerifiedBadge,
  FeaturedBadge,
  PremiumBadge,
  NewListingBadge,
  NegotiableBadge,
  SoldBadge,
} from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingBadgeKind } from "@/lib/design/listing-badges";

/**
 * Premium vehicle gallery — presentation only.
 * Save / Share live in the summary column (buyer hierarchy: photo → price → trust → contact).
 */
export function VehicleDetailHero({
  images,
  title,
  badges,
  featured,
  verified,
}: {
  images: string[];
  title: string;
  listingId?: string;
  shareUrl?: string;
  city?: string;
  autoCategory?: string | null;
  badges?: ListingBadgeKind[];
  featured?: boolean;
  verified?: boolean;
}) {
  const photos = images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setIndex(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || photos.length === 0) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }, [index, photos.length]);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(photos.length - 1, i + 1));
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  function handleSwipe(diff: number) {
    if (Math.abs(diff) < 48) return;
    if (diff > 0) goNext();
    else goPrev();
  }

  const badgeRow = (
    <div className="absolute left-3 top-3 z-10 flex max-w-[75%] flex-wrap gap-1.5 sm:left-4 sm:top-4">
      {verified ? <VerifiedBadge size="sm" /> : null}
      {featured ? <FeaturedBadge /> : null}
      {badges?.includes("premium") ? <PremiumBadge size="sm" /> : null}
      {badges?.includes("new") ? <NewListingBadge /> : null}
      {badges?.includes("negotiable") ? <NegotiableBadge size="sm" /> : null}
      {badges?.includes("sold") ? <SoldBadge size="sm" /> : null}
    </div>
  );

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-navy/[0.06] to-navy/[0.02] ring-1 ring-navy/10 lg:aspect-[16/10] lg:rounded-3xl">
        <p className="text-sm font-medium text-muted">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="group relative overflow-hidden bg-navy/[0.03] shadow-[0_12px_40px_-16px_rgba(3,27,78,0.35)] ring-navy/10 max-lg:-mx-0 max-lg:rounded-none max-lg:ring-0 lg:rounded-3xl lg:ring-1">
        <div
          ref={scrollRef}
          className="snap-x-mandatory hide-scrollbar flex aspect-[5/6] overflow-x-auto sm:aspect-[4/5] lg:aspect-[16/10]"
        >
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className="relative min-w-full snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
              onClick={() => {
                setIndex(i);
                setFullscreen(true);
              }}
              aria-label={`View photo ${i + 1} of ${photos.length} fullscreen`}
            >
              <Image
                src={url}
                alt={i === 0 ? title : `${title} photo ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-navy/10" />
            </button>
          ))}
        </div>
        {badgeRow}
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="pressable absolute right-3 top-3 z-10 inline-flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-bold text-navy shadow-float backdrop-blur-sm transition hover:bg-white sm:right-4 sm:top-4"
          aria-label="Open fullscreen gallery"
        >
          <Expand className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Fullscreen</span>
        </button>
        {photos.length > 1 ? (
          <span className="absolute bottom-3 right-3 z-10 rounded-full bg-navy/80 px-3 py-1 text-[11px] font-bold tabular-nums tracking-wide text-white backdrop-blur-md sm:bottom-4 sm:right-4 sm:text-xs">
            {index + 1} / {photos.length}
          </span>
        ) : null}
        {photos.length > 1 ? (
          <>
            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 pr-16 sm:bottom-4">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to photo ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-7 bg-gold" : "w-1.5 bg-white/50 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              disabled={index === 0}
              className="pressable absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy shadow-float backdrop-blur-sm disabled:opacity-30 lg:inline-flex"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={index === photos.length - 1}
              className="pressable absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-navy shadow-float backdrop-blur-sm disabled:opacity-30 lg:inline-flex"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {photos.length > 1 ? (
        <ul className="mt-3 hidden gap-2 px-3 sm:grid sm:grid-cols-5 lg:mt-3 lg:grid-cols-6 lg:px-0">
          {photos.slice(0, 6).map((url, i) => (
            <li key={`thumb-${url}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "relative aspect-[4/3] w-full overflow-hidden rounded-xl ring-1 transition",
                  i === index
                    ? "ring-2 ring-gold shadow-card"
                    : "ring-navy/10 opacity-80 hover:opacity-100",
                )}
                aria-label={`Select photo ${i + 1}`}
                aria-current={i === index}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {fullscreen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen vehicle gallery"
          className="fixed inset-0 z-[100] flex flex-col bg-navy-dark"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            handleSwipe(touchStartX.current - e.changedTouches[0].clientX);
          }}
        >
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="pressable absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
          <span className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] z-10 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
            {index + 1} / {photos.length}
          </span>
          <div className="relative flex flex-1 items-center justify-center p-3">
            <div className="relative h-full w-full max-h-[88vh] animate-image-reveal">
              <Image
                src={photos[index]}
                alt={title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                className="pressable absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm disabled:opacity-30"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={index === photos.length - 1}
                className="pressable absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm disabled:opacity-30"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

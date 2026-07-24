"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  VerifiedBadge,
  FeaturedBadge,
  PremiumBadge,
  NewListingBadge,
  NegotiableBadge,
  SoldBadge,
} from "@/components/ui/badge";
import { ShareButton } from "@/components/property/listing-share-menu";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { cn } from "@/lib/utils";
import type { ListingBadgeKind } from "@/lib/design/listing-badges";

export function VehicleDetailHero({
  images,
  title,
  listingId,
  shareUrl,
  city,
  autoCategory,
  badges,
  featured,
  verified,
}: {
  images: string[];
  title: string;
  listingId: string;
  shareUrl: string;
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
    <div className="absolute left-3 top-3 z-10 flex max-w-[70%] flex-wrap gap-1.5">
      {verified ? <VerifiedBadge size="sm" /> : null}
      {featured ? <FeaturedBadge /> : null}
      {badges?.includes("premium") ? <PremiumBadge size="sm" /> : null}
      {badges?.includes("new") ? <NewListingBadge /> : null}
      {badges?.includes("negotiable") ? <NegotiableBadge size="sm" /> : null}
      {badges?.includes("sold") ? <SoldBadge size="sm" /> : null}
    </div>
  );

  const actions = (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
      <ListingSaveButton
        listingId={listingId}
        compact
        className="pressable !h-10 !w-10 rounded-full bg-elevated/90 shadow-float backdrop-blur-sm [&_svg]:!h-4 [&_svg]:!w-4"
      />
      <ShareButton
        title={title}
        text={`${title} on Yike`}
        url={shareUrl}
        listingId={listingId}
        city={city}
        listingType="sale"
        propertyType={autoCategory}
      />
    </div>
  );

  if (photos.length === 0) {
    return (
      <div className="detail-hero flex aspect-[4/3] items-center justify-center bg-navy/5">
        <p className="text-sm font-medium text-muted">No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="detail-hero relative">
        <div
          ref={scrollRef}
          className="snap-x-mandatory hide-scrollbar flex aspect-[4/3] overflow-x-auto lg:aspect-[16/10]"
        >
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className="relative min-w-full snap-center"
              onClick={() => {
                setIndex(i);
                setFullscreen(true);
              }}
            >
              <Image
                src={url}
                alt={i === 0 ? title : `${title} photo ${i + 1}`}
                fill
                className="object-cover transition-opacity duration-300"
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </button>
          ))}
        </div>
        {badgeRow}
        {actions}
        {photos.length > 1 ? (
          <span className="absolute bottom-3 right-3 z-10 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-bold tabular-nums text-white backdrop-blur-sm">
            {index + 1} / {photos.length}
          </span>
        ) : null}
        {photos.length > 1 ? (
          <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 pr-16">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-7 bg-gold" : "w-1.5 bg-white/45"
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {fullscreen ? (
        <div
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
            aria-label="Close"
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

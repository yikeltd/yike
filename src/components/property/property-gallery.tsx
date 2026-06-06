"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { ListingImage } from "./listing-image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { VerifiedBadge, FeaturedBadge } from "@/components/ui/badge";
import { ShareButton } from "./listing-share-menu";
import type { Property } from "@/types/database";
import { listingImageAlt } from "@/lib/image-seo";
import { optimizeListingImageUrl } from "@/lib/image-url";
import { prefetchListingImages } from "@/lib/image-prefetch";
import { cn } from "@/lib/utils";

export function PropertyGallery({
  images,
  title,
  featured,
  verified,
  shareUrl,
  imageSeo,
  listingId,
  city,
  listingType,
  propertyType,
}: {
  images: string[];
  title: string;
  featured?: boolean;
  verified?: boolean;
  shareUrl?: string;
  imageSeo?: Pick<
    Property,
    "title" | "bedrooms" | "property_type" | "area" | "city" | "listing_type"
  >;
  listingId?: string;
  city?: string;
  listingType?: string;
  propertyType?: string | null;
}) {
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
    prefetchListingImages(
      images.slice(index + 1, index + 4),
      1200
    );
  }, [index, images]);

  useEffect(() => {
    prefetchListingImages(images.slice(1, 4), 1200);
  }, [images]);

  function scrollTo(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  }

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(images.length - 1, i + 1));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  function handleSwipe(diff: number) {
    if (Math.abs(diff) < 48) return;
    if (diff > 0) goNext();
    else goPrev();
  }

  const badges = (
    <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5 lg:left-4 lg:top-4">
      {verified && <VerifiedBadge size="sm" />}
      {featured && <FeaturedBadge />}
    </div>
  );

  const share = shareUrl && (
    <div className="absolute right-3 top-3 z-10 lg:right-4 lg:top-4">
      <ShareButton
        title={title}
        text={`Check out this home on Yike: ${title}`}
        url={shareUrl}
        listingId={listingId}
        city={city ?? imageSeo?.city}
        listingType={listingType ?? imageSeo?.listing_type}
        propertyType={propertyType ?? imageSeo?.property_type}
      />
    </div>
  );

  function altFor(index: number) {
    if (imageSeo) return listingImageAlt(imageSeo, index);
    return index === 0 ? title : `${title} photo ${index + 1}`;
  }

  const counter = images.length > 1 && (
    <span className="absolute right-3 top-14 z-10 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm lg:top-16">
      {index + 1} / {images.length}
    </span>
  );

  const mobileCarousel = (
    <div className="relative lg:hidden">
      <div
        ref={scrollRef}
        className="snap-x-mandatory hide-scrollbar flex aspect-[5/6] overflow-x-auto sm:aspect-[4/5]"
      >
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            className="relative min-w-full snap-center"
            onClick={() => {
              setIndex(i);
              setFullscreen(true);
            }}
          >
            <ListingImage
              src={url}
              alt={altFor(i)}
              priority={i === 0}
              sizes="100vw"
              width={1200}
            />
          </button>
        ))}
      </div>
      {badges}
      {share}
      {counter}
      {images.length > 1 && (
        <>
          <div className="gradient-scrim-light pointer-events-none absolute inset-x-0 bottom-0 h-24" />
          <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-7 bg-gold" : "w-1.5 bg-white/45"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const desktopGrid = (
    <div className="relative hidden overflow-hidden rounded-2xl ring-1 ring-black/[0.04] lg:block">
      <div
        className={cn(
          "grid gap-1.5",
          images.length === 1
            ? "grid-cols-1"
            : images.length === 2
              ? "grid-cols-2"
              : "grid-cols-4 grid-rows-2"
        )}
        style={{ minHeight: images.length > 2 ? "460px" : "360px" }}
      >
        {images.slice(0, 5).map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => {
              setIndex(i);
              setFullscreen(true);
            }}
            className={cn(
              "group relative min-h-[180px] overflow-hidden bg-surface",
              images.length > 2 && i === 0 && "col-span-2 row-span-2",
              images.length > 2 && i > 0 && "min-h-[220px]"
            )}
          >
            <ListingImage
              src={url}
              alt={altFor(i)}
              priority={i === 0}
              sizes="(max-width: 1280px) 50vw, 640px"
              width={i === 0 ? 1200 : 640}
              className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
      {badges}
      {share}
      {images.length > 5 && (
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="pressable absolute bottom-4 right-4 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy shadow-float"
        >
          Show all {images.length} photos
        </button>
      )}
    </div>
  );

  return (
    <>
      {mobileCarousel}
      {desktopGrid}
      {fullscreen && (
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
            {index + 1} / {images.length}
          </span>
          <div className="flex flex-1 items-center justify-center p-3">
            <div className="relative h-full w-full max-h-[88vh] animate-image-reveal">
              <Image
                src={optimizeListingImageUrl(images[index], 1600)}
                alt={altFor(index)}
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                className="pressable absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm disabled:opacity-30 lg:left-6"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={index === images.length - 1}
                className="pressable absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 p-3 text-white backdrop-blur-sm disabled:opacity-30 lg:right-6"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="flex justify-center gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === index ? "w-8 bg-gold" : "w-2 bg-white/35"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice } from "@/lib/utils";
import { buildMotionSlides } from "@/lib/media/items";
import { optimizeListingImageUrl } from "@/lib/image-url";
import { DynamicWatermark } from "@/components/ui/dynamic-watermark";

type Props = {
  property: Property;
  priority?: boolean;
  isActive?: boolean;
  dragHint?: "left" | "right" | "up" | "down" | null;
};

export function DiscoverCard({
  property,
  priority,
  isActive = true,
  dragHint = null,
}: Props) {
  const slides = buildMotionSlides(property);
  const photos = slides.map((s) => s.url);
  const [photoIndex, setPhotoIndex] = useState(0);

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  const location = [property.area || property.city, property.state || property.city]
    .filter(Boolean)
    .join(", ");

  const currentPhoto = photos[photoIndex] || photos[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80&fit=crop";

  function handlePhotoTap(e: React.MouseEvent<HTMLDivElement>) {
    if (photos.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.35) {
      // Tap left 35% -> Previous photo
      setPhotoIndex((i) => Math.max(0, i - 1));
    } else {
      // Tap right 65% -> Next photo
      setPhotoIndex((i) => Math.min(photos.length - 1, i + 1));
    }
  }

  return (
    <article
      onClick={handlePhotoTap}
      className="relative h-full w-full select-none overflow-hidden bg-navy shadow-2xl cursor-pointer"
    >
      {/* 1. EDGE-TO-EDGE FULL-SCREEN IMAGE HERO */}
      <div className="absolute inset-0">
        <Image
          src={optimizeListingImageUrl(currentPhoto, 1080)}
          alt={property.title}
          fill
          priority={priority}
          className="object-cover object-center transition-all duration-300 ease-out"
          sizes="100vw"
        />

        {/* Dynamic Username Watermark */}
        <DynamicWatermark className="opacity-[0.06]" />

        {/* Subtle Top & Bottom Gradient Overlays */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-navy/90 via-navy/40 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-navy/95 via-navy/60 to-transparent z-10" />
      </div>

      {/* 2. PHOTO COUNTER & AREA BADGE (UNDER TOP BAR) */}
      <div className="absolute inset-x-0 top-[calc(max(3.75rem,env(safe-area-inset-top))+0.75rem)] z-20 flex items-center justify-between px-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>New in your area</span>
        </div>

        <div className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
          {photoIndex + 1} / {photos.length || 1}
        </div>
      </div>

      {/* 3. PINNED BOTTOM INFORMATION (NAME, PRICE, LOCATION ONLY) */}
      <div className="absolute inset-x-0 bottom-[calc(var(--bottom-nav-stack)+0.75rem)] z-20 space-y-1.5 px-5 text-left pointer-events-none">
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md line-clamp-2">
          {property.title}
        </h2>

        <p className="text-2xl font-black text-gold leading-none drop-shadow-md tracking-tight">
          {price}
        </p>

        <p className="flex items-center gap-1.5 text-xs font-semibold text-white/85 drop-shadow-xs pt-0.5">
          <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
          <span>{location}</span>
        </p>
      </div>
    </article>
  );
}

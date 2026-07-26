"use client";

import Image from "next/image";
import { Heart, MapPin, BedDouble, Bath, Gauge } from "lucide-react";
import type { Property } from "@/types/database";
import { formatPrice, cn } from "@/lib/utils";
import { VerifiedBadge, FeaturedBadge } from "@/components/ui/badge";
import { isTrustVerified } from "@/lib/hub-filters";
import { isFeaturedActive } from "@/lib/agent-tiers";
import { MotionSlide } from "@/components/browse/motion-slide";
import { buildMotionSlides } from "@/lib/media/items";
import { normalizeAssetType } from "@/lib/marketplace/listings";
import { motionEnabled } from "@/lib/swipe/low-data";

type Props = {
  property: Property;
  priority?: boolean;
  isActive?: boolean;
  showQuickSpecs?: boolean;
  saved?: boolean;
  onToggleSave?: () => void;
  dragHint?: "left" | "right" | "up" | "down" | null;
};

function QuickSpecs({ property }: { property: Property }) {
  const isVehicle = normalizeAssetType(property.asset_type) === "VEHICLE";

  if (isVehicle) {
    const bits = [
      property.year ? String(property.year) : null,
      property.make,
      property.model,
      property.fuel_type,
      property.mileage != null
        ? `${Number(property.mileage).toLocaleString()} km`
        : null,
    ].filter(Boolean);

    return (
      <ul className="mt-3 flex flex-wrap gap-2">
        {bits.map((bit) => (
          <li
            key={bit}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm"
          >
            <Gauge className="h-3 w-3 text-gold" aria-hidden />
            {bit}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {property.bedrooms != null ? (
        <li className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
          <BedDouble className="h-3 w-3 text-gold" aria-hidden />
          {property.bedrooms} bed
        </li>
      ) : null}
      {property.bathrooms != null ? (
        <li className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
          <Bath className="h-3 w-3 text-gold" aria-hidden />
          {property.bathrooms} bath
        </li>
      ) : null}
      {property.property_type ? (
        <li className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-semibold capitalize text-white/90 backdrop-blur-sm">
          {property.property_type.replace(/_/g, " ")}
        </li>
      ) : null}
    </ul>
  );
}

export function DiscoverCard({
  property,
  priority,
  isActive = true,
  showQuickSpecs = false,
  saved = false,
  onToggleSave,
  dragHint = null,
}: Props) {
  const verified = isTrustVerified(property);
  const featured = isFeaturedActive(property);
  const agent = property.agent;
  const photoCount = buildMotionSlides(property).length;
  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type,
  );
  const location = [property.area, property.city].filter(Boolean).join(", ");
  const useMotion = isActive && motionEnabled();

  return (
    <article className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-navy shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0">
        {useMotion ? (
          <MotionSlide
            property={property}
            isActive={isActive}
            priority={priority}
          />
        ) : (
          <div className="relative h-full w-full bg-navy">
            {/* Static cover when inactive / low-data */}
            <MotionSlide
              property={property}
              isActive={false}
              priority={priority}
            />
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#021433]/92 via-[#021433]/25 to-transparent" />

      {/* Drag intention overlays */}
      {dragHint === "right" ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-start bg-emerald-500/15 p-6">
          <span className="rotate-[-12deg] rounded-xl border-2 border-emerald-400 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-emerald-300">
            Interested
          </span>
        </div>
      ) : null}
      {dragHint === "left" ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end bg-rose-500/15 p-6">
          <span className="rotate-[12deg] rounded-xl border-2 border-rose-400 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-rose-300">
            Skip
          </span>
        </div>
      ) : null}
      {dragHint === "up" ? (
        <div className="pointer-events-none absolute inset-x-0 top-8 z-20 flex justify-center">
          <span className="rounded-xl border-2 border-white/70 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
            Open listing
          </span>
        </div>
      ) : null}
      {dragHint === "down" ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center">
          <span className="rounded-xl border-2 border-gold px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-gold">
            Quick specs
          </span>
        </div>
      ) : null}

      <div className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between p-4 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {verified ? <VerifiedBadge size="sm" /> : null}
          {featured ? <FeaturedBadge /> : null}
        </div>
        <div className="flex items-center gap-2">
          {photoCount > 1 ? (
            <span className="rounded-full bg-navy/70 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
              {photoCount} photos
            </span>
          ) : null}
          {onToggleSave ? (
            <button
              type="button"
              className={cn(
                "pressable pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors",
                saved
                  ? "bg-gold/25 text-gold"
                  : "bg-navy/70 text-white",
              )}
              aria-label={saved ? "Saved" : "Save listing"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleSave();
              }}
            >
              <Heart
                className={cn("h-4 w-4", saved && "fill-current")}
                strokeWidth={2.4}
              />
            </button>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 p-5 pb-5">
        <p className="text-[clamp(1.55rem,6.5vw,1.9rem)] font-bold leading-none tracking-tight text-white tabular-nums">
          {price}
        </p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white/95">
          {property.title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm font-medium text-white/75">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
          <span className="truncate">{location}</span>
        </p>

        <QuickSpecs property={property} />

        {showQuickSpecs ? (
          <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/70">
            {property.description?.trim() ||
              "Swipe up to open the full listing for photos, contact, and details."}
          </p>
        ) : null}
        {agent ? (
          <div className="mt-3 flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/20">
              {agent.avatar_url ? (
                <Image
                  src={agent.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/80">
                  {(agent.full_name ?? "S").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <p className="truncate text-xs font-semibold text-white/70">
              {agent.full_name ?? "Seller"}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

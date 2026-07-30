"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Property } from "@/types/database";
import { listingPath } from "@/lib/marketplace/listing-path";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { ListingDistanceLabel } from "@/components/marketplace/listing-distance-label";
import { BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";
import { isDemoProperty } from "@/lib/mock-listings";
import { cn, isVerifiedAgent } from "@/lib/utils";
import {
  MapPin,
  Gauge,
  Fuel,
  Settings2,
  Calendar,
  ShieldCheck,
  Eye,
  Scale,
  MessageCircle,
} from "lucide-react";
import {
  PlacementBadge,
  featuredPlacementChrome,
} from "@/components/marketplace/placement-badge";
import { resolvePlacementKind } from "@/lib/marketplace/placement";
import { VehicleQuickPreviewModal } from "./vehicle-quick-preview-modal";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function transmissionShort(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "automatic") return "Auto";
  if (v === "manual") return "Manual";
  if (v === "cvt") return "CVT";
  return value;
}

function fuelShort(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "petrol" || v === "gasoline") return "Petrol";
  if (v === "diesel") return "Diesel";
  if (v === "electric" || v === "ev") return "EV";
  if (v === "hybrid") return "Hybrid";
  if (v === "cng") return "CNG";
  return value;
}

function conditionShort(value?: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/_/g, " ");
  if (v.includes("foreign") || v === "tokunbo") return "Foreign used";
  if (v.includes("nigeria") || v === "local") return "Nigerian used";
  if (v.includes("new") || v === "brand new") return "Brand new";
  return value.length > 14 ? `${value.slice(0, 12)}…` : value;
}

type AttrItem = { icon: typeof Gauge; label: string };

function buildVehicleAttrs(vehicle: Property): AttrItem[] {
  const items: AttrItem[] = [];
  if (vehicle.year) {
    items.push({ icon: Calendar, label: String(vehicle.year) });
  }
  if (vehicle.mileage != null) {
    items.push({
      icon: Gauge,
      label: `${vehicle.mileage.toLocaleString()} km`,
    });
  }
  const transmission = transmissionShort(vehicle.transmission);
  if (transmission) {
    items.push({ icon: Settings2, label: transmission });
  }
  const fuel = fuelShort(vehicle.fuel_type);
  if (fuel) {
    items.push({ icon: Fuel, label: fuel });
  }
  const condition = conditionShort(vehicle.vehicle_condition);
  if (condition && items.length < 4) {
    items.push({ icon: ShieldCheck, label: condition });
  }
  return items;
}

export function VehicleCard({
  vehicle,
  variant = "default",
  priorityImage = false,
  onToggleCompare,
  isCompared = false,
}: {
  vehicle: Property;
  variant?: "default" | "marketplace" | "browse";
  priorityImage?: boolean;
  onToggleCompare?: (vehicle: Property) => void;
  isCompared?: boolean;
}) {
  const href = listingPath(vehicle);
  const img = vehicle.media_urls?.[0];
  const placement = resolvePlacementKind(vehicle);
  const isBrowse = variant === "browse";
  const isMarketplace = variant === "marketplace" || isBrowse;
  const isDemo = isDemoProperty(vehicle.id);
  const location = [vehicle.area, vehicle.city || vehicle.state]
    .filter(Boolean)
    .join(", ");
  const verified =
    vehicle.is_verified_listing ||
    (vehicle.agent ? isVerifiedAgent(vehicle.agent) : false);
  const attrs = buildVehicleAttrs(vehicle);
  const [quickPreviewOpen, setQuickPreviewOpen] = useState(false);

  function openPreview(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setQuickPreviewOpen(true);
  }

  function handleCompareClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleCompare) onToggleCompare(vehicle);
  }

  return (
    <>
      <article
        className={cn(
          "group card-lift relative flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-elevated shadow-card ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
        )}
      >
        <Link href={href} prefetch={!isDemo} className="block">
          <div
            className={cn(
              "listing-thumb relative overflow-hidden rounded-[1.25rem] bg-navy/5",
              BROWSE_THUMB_ASPECT,
              featuredPlacementChrome(placement === "featured")
            )}
          >
            {img ? (
              <Image
                src={img}
                alt={vehicle.title}
                fill
                priority={priorityImage}
                loading={priorityImage ? undefined : "lazy"}
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 25vw, (max-width: 1536px) 14vw, 12vw"
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/35 to-transparent" />
            <div className="absolute left-1.5 top-1.5 z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-1">
              <span className="rounded-md bg-navy/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                {conditionShort(vehicle.vehicle_condition) || "Vehicle"}
              </span>
              {placement ? (
                <PlacementBadge kind={placement} compact />
              ) : null}
              {verified ? (
                <span
                  className="rounded-md bg-emerald-600/92 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-[2px]"
                  title="Verified Vehicle & Dealer"
                >
                  ✓ Verified
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        {/* TOP RIGHT ACTION OVERLAY BUTTONS */}
        <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 flex gap-1">
          {onToggleCompare && (
            <button
              type="button"
              onClick={handleCompareClick}
              className={cn(
                "pointer-events-auto pressable flex h-8 w-8 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-transform hover:scale-105",
                isCompared
                  ? "bg-gold text-navy font-black ring-2 ring-gold/40"
                  : "bg-white/95 text-navy/80"
              )}
              title={isCompared ? "Remove from Compare" : "Compare Vehicle"}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={openPreview}
            className="pointer-events-auto pressable flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-navy shadow-sm backdrop-blur-sm transition-transform hover:scale-105"
            title="Quick Preview"
          >
            <Eye className="h-3.5 w-3.5 text-navy/80" />
          </button>

          {!isDemo && (
            <div className="pointer-events-auto">
              <ListingSaveButton
                listingId={vehicle.id}
                compact
                className="!h-8 !w-8 !bg-white/95 !text-navy shadow-sm backdrop-blur-sm"
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3">
          <Link href={href} prefetch={!isDemo} className="block min-w-0 space-y-1">
            <p className="text-sm font-black tabular-nums leading-tight tracking-tight text-foreground sm:text-base">
              {formatNaira(Number(vehicle.price))}
            </p>
            <p className="line-clamp-2 text-[12px] font-bold leading-snug text-foreground/90 sm:text-[13px]">
              {vehicle.title}
            </p>
            {attrs.length > 0 ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-muted">
                {attrs.slice(0, 4).map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-0.5">
                    <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {label}
                  </span>
                ))}
              </p>
            ) : null}
            {location ? (
              <p className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-muted">
                <MapPin className="h-2.5 w-2.5 shrink-0 text-gold" aria-hidden />
                <span className="line-clamp-1">{location}</span>
                <ListingDistanceLabel
                  city={vehicle.city}
                  state={vehicle.state}
                  className="ml-auto shrink-0 tabular-nums text-navy/40"
                />
              </p>
            ) : null}
          </Link>
        </div>
      </article>

      {/* QUICK PREVIEW MODAL */}
      {quickPreviewOpen && (
        <VehicleQuickPreviewModal
          vehicle={vehicle}
          onClose={() => setQuickPreviewOpen(false)}
        />
      )}
    </>
  );
}

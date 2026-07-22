"use client";

import Link from "next/link";
import Image from "next/image";
import type { Property } from "@/types/database";
import { listingPath } from "@/lib/marketplace/listing-path";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { isFeaturedActive } from "@/lib/agent-tiers";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function VehicleCard({ vehicle }: { vehicle: Property }) {
  const href = listingPath(vehicle);
  const img = vehicle.media_urls?.[0];
  const featured = isFeaturedActive(vehicle);

  return (
    <article className="overflow-hidden rounded-xl border border-black/8 bg-white">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] bg-navy/5">
          {img ? (
            <Image
              src={img}
              alt={vehicle.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : null}
          {featured ? (
            <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
              Featured
            </span>
          ) : null}
          {vehicle.is_verified_listing ? (
            <span className="absolute right-2 top-2 rounded-full bg-navy/90 px-2 py-0.5 text-[10px] font-bold text-white">
              Verified
            </span>
          ) : null}
        </div>
      </Link>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-black/45">
              {vehicleCategoryLabel(vehicle.auto_category)}
              {vehicle.year ? ` · ${vehicle.year}` : ""}
            </p>
            <Link href={href} className="mt-0.5 block line-clamp-2 font-semibold text-navy">
              {vehicle.title}
            </Link>
          </div>
          <ListingSaveButton listingId={vehicle.id} />
        </div>
        <p className="text-lg font-bold text-navy">{formatNaira(Number(vehicle.price))}</p>
        <p className="text-xs text-black/50">
          {[vehicle.city, vehicle.state].filter(Boolean).join(", ")}
          {vehicle.mileage != null
            ? ` · ${vehicle.mileage.toLocaleString()} km`
            : ""}
        </p>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck } from "lucide-react";
import type { Property } from "@/types/database";
import { listingPath } from "@/lib/marketplace/listing-path";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";
import { electronicsCategoryLabel } from "@/lib/marketplace/electronics-specs";
import { cn, isVerifiedAgent } from "@/lib/utils";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ElectronicsCard({
  listing,
  variant = "browse",
  priorityImage = false,
}: {
  listing: Property;
  variant?: "browse" | "compact";
  priorityImage?: boolean;
}) {
  const href = listingPath(listing);
  const photo = listing.media_urls?.[0] ?? "/images/logo.webp";
  const verified =
    listing.is_verified_listing ||
    (listing.agent ? isVerifiedAgent(listing.agent) : false);
  const category = electronicsCategoryLabel(listing.auto_category);
  const location = [listing.area, listing.city].filter(Boolean).join(", ");

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm ring-1 ring-black/[0.03] transition-all hover:border-gold/40 hover:shadow-md",
        variant === "compact" && "rounded-xl",
      )}
    >
      <Link href={href} className="relative block w-full overflow-hidden bg-navy/5">
        <div className={cn("relative w-full", BROWSE_THUMB_ASPECT)}>
          <Image
            src={photo}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={priorityImage}
          />
        </div>
        <span className="absolute left-2 top-2 rounded-full bg-navy/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {category}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold text-navy">{listing.title}</h3>
            <p className="mt-0.5 text-lg font-black text-navy">{formatNaira(Number(listing.price))}</p>
          </Link>
          <ListingSaveButton listingId={listing.id} className="shrink-0" />
        </div>
        <p className="text-xs text-muted line-clamp-1">
          {[listing.make, listing.model].filter(Boolean).join(" · ")}
        </p>
        {location ? (
          <p className="flex items-center gap-1 text-xs text-navy/60">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {location}
          </p>
        ) : null}
        {verified ? (
          <p className="flex items-center gap-1 text-[10px] font-bold text-gold-dark">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Verified listing
          </p>
        ) : null}
      </div>
    </article>
  );
}

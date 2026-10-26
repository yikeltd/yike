"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, ShieldCheck } from "lucide-react";
import type { Property } from "@/types/database";
import { persistBrowseReturn } from "@/lib/marketplace/browse-navigation";
import { useMarketplaceBrowseReturn } from "@/hooks/use-marketplace-browse-return";
import { ListingSaveButton } from "@/components/marketplace/listing-save-button";
import { listingSaveAnalyticsFromProperty } from "@/lib/listings/toggle-listing-save";
import { BROWSE_THUMB_ASPECT } from "@/lib/marketplace/browse-grid";
import { electronicsCategoryLabel } from "@/lib/marketplace/electronics-specs";
import { YIKE_LISTING_CARD } from "@/lib/design/yike-classes";
import { cn, isVerifiedAgent } from "@/lib/utils";

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

const ELECTRONICS_CARD_FALLBACK = "/images/logo.webp";

export function ElectronicsCard({
  listing,
  variant = "browse",
  priorityImage = false,
}: {
  listing: Property;
  variant?: "browse" | "compact";
  priorityImage?: boolean;
}) {
  const { browseReturn, listingHref } = useMarketplaceBrowseReturn();
  const href = listingHref(listing);
  const rawPhoto = listing.media_urls?.[0];
  const photo =
    rawPhoto && rawPhoto.trim().length > 0
      ? rawPhoto
      : ELECTRONICS_CARD_FALLBACK;
  const verified =
    listing.is_verified_listing ||
    (listing.agent ? isVerifiedAgent(listing.agent) : false);
  const category = electronicsCategoryLabel(listing.auto_category);
  const location = [listing.area, listing.city].filter(Boolean).join(", ");

  return (
    <article className={cn(YIKE_LISTING_CARD, variant === "compact" && "rounded-xl")}>
      <div className="relative block w-full overflow-hidden bg-navy/5">
        <Link
          href={href}
          className="relative block w-full"
          onClick={() => persistBrowseReturn(browseReturn)}
        >
          <div
            className={cn(
              "listing-thumb relative w-full overflow-hidden rounded-[1.25rem] bg-navy/5",
              BROWSE_THUMB_ASPECT,
            )}
          >
            <Image
              src={photo}
              alt={listing.title}
              fill
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-[1.02]",
                photo === ELECTRONICS_CARD_FALLBACK && "object-contain p-6",
              )}
              sizes="(max-width: 768px) 50vw, 25vw"
              priority={priorityImage}
            />
          </div>
          <span className="absolute left-1.5 top-1.5 rounded-md bg-navy/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {category}
          </span>
        </Link>
        <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 flex gap-1">
          <ListingSaveButton
            listingId={listing.id}
            variant="card-overlay"
            redirectPath={href}
            analytics={listingSaveAnalyticsFromProperty(listing, "card")}
            sellerId={listing.agent_id}
            listingTitle={listing.title}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <Link href={href} className="min-w-0">
          <p className="text-sm font-black tabular-nums leading-tight tracking-tight text-foreground sm:text-base">
            {formatNaira(Number(listing.price))}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-foreground/90 sm:text-[13px]">
            {listing.title}
          </h3>
        </Link>
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

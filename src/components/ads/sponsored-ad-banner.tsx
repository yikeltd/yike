"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Advertisement } from "@/types/database";
import type { AdvertisementPlacement } from "@/lib/advertisements/constants";
import { SPONSORED_LABEL } from "@/lib/advertisements/constants";
import { cn } from "@/lib/utils";

function isInternalPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

export function SponsoredAdBanner({
  ad,
  placement,
  compact,
  className,
}: {
  ad: Advertisement;
  placement: AdvertisementPlacement;
  compact?: boolean;
  className?: string;
}) {
  const tracked = useRef(false);
  const internal = isInternalPath(ad.destination_url);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void fetch("/api/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advertisementId: ad.id, placement }),
    });
  }, [ad.id, placement]);

  function handleClick() {
    void fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advertisementId: ad.id, placement }),
    });
  }

  const imageUrl =
    compact && ad.mobile_image_url ? ad.mobile_image_url : ad.image_url;
  const isSearch = placement === "search_results";
  const isHomepageSlot = placement.startsWith("homepage_slot_");

  const media = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]",
        (isSearch || isHomepageSlot) && "rounded-xl",
      )}
    >
      <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-navy/75 px-2 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-sm">
        {SPONSORED_LABEL}
      </span>
      <div
        className={cn(
          "relative w-full",
          compact || isSearch || isHomepageSlot
            ? "aspect-[2.4/1] max-h-[112px] sm:max-h-[128px]"
            : "aspect-[2.4/1] max-h-[160px]",
        )}
      >
        <Image
          src={imageUrl}
          alt={ad.title}
          fill
          loading="lazy"
          className="object-cover"
          sizes={
            isSearch || isHomepageSlot
              ? "(max-width: 768px) 94vw, 1100px"
              : "100vw"
          }
          unoptimized={
            imageUrl.startsWith("http") && !imageUrl.includes("supabase")
          }
        />
      </div>
    </div>
  );

  const sharedClass = cn("pressable block", className);

  if (internal) {
    return (
      <Link
        href={ad.destination_url}
        onClick={handleClick}
        className={sharedClass}
        prefetch={false}
      >
        {media}
      </Link>
    );
  }

  return (
    <a
      href={ad.destination_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={sharedClass}
    >
      {media}
    </a>
  );
}

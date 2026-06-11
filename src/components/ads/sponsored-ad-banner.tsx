"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { Advertisement } from "@/types/database";
import type { AdvertisementPlacement } from "@/lib/advertisements/constants";
import { SPONSORED_LABEL } from "@/lib/advertisements/constants";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void fetch("/api/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advertisementId: ad.id, placement }),
    });
  }, [ad.id, placement]);

  async function handleClick() {
    void fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ advertisementId: ad.id, placement }),
    });
  }

  const imageUrl =
    compact && ad.mobile_image_url ? ad.mobile_image_url : ad.image_url;
  const isSearch = placement === "search_results";

  return (
    <a
      href={ad.destination_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => void handleClick()}
      className={cn("pressable block", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-surface ring-1 ring-black/[0.04]",
          isSearch && "rounded-xl"
        )}
      >
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-navy/75 px-2 py-0.5 text-[10px] font-semibold text-white/95 backdrop-blur-sm">
          {SPONSORED_LABEL}
        </span>
        <div
          className={cn(
            "relative w-full",
            compact || isSearch ? "aspect-[2.2/1] max-h-[120px]" : "aspect-[2.4/1] max-h-[160px]"
          )}
        >
          <Image
            src={imageUrl}
            alt={ad.title}
            fill
            className="object-cover"
            sizes={isSearch ? "(max-width: 768px) 90vw, 640px" : "100vw"}
            unoptimized={
              imageUrl.startsWith("http") && !imageUrl.includes("supabase")
            }
          />
        </div>
        {ad.title && !compact ? (
          <p className="border-t border-surface px-3 py-2 text-xs font-medium text-navy line-clamp-1">
            {ad.title}
          </p>
        ) : null}
      </div>
    </a>
  );
}

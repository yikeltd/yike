"use client";

import type { Advertisement } from "@/types/database";
import type { AdvertisementPlacement } from "@/lib/advertisements/constants";
import { SponsoredAdBanner } from "@/components/ads/sponsored-ad-banner";
import { cn } from "@/lib/utils";

/**
 * Homepage smart ad — renders nothing when inactive / missing.
 * No empty placeholders, no reserved spacing.
 */
export function HomeAdSlot({
  ad,
  placement,
  className,
}: {
  ad: Advertisement | null | undefined;
  placement: AdvertisementPlacement;
  className?: string;
}) {
  if (!ad?.image_url?.trim()) return null;

  return (
    <div
      className={cn("pb-4", className)}
      aria-label="Sponsored"
    >
      <SponsoredAdBanner ad={ad} placement={placement} compact />
    </div>
  );
}

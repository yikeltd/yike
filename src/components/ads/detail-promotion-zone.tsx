import type { AdPlacementKey } from "@/constants/adPlacements";
import type { AdPlacement } from "@/types/database";
import { getActiveAd } from "@/lib/ads";
import { AdBanner } from "@/components/ads/ad-banner";
import { cn } from "@/lib/utils";

type DetailPlacement = Extract<AdPlacementKey, "property_detail" | "vehicle_detail">;

/**
 * Detail-page promotion zone — renders nothing unless an active creative exists.
 * No min-height, padding, or margin when empty (avoids white gap above footer).
 */
export async function DetailPromotionZone({
  placement,
  ad: adProp,
  className,
}: {
  placement: DetailPlacement;
  /** Pass a preloaded ad to avoid a second fetch. */
  ad?: AdPlacement | null;
  className?: string;
}) {
  const ad = adProp !== undefined ? adProp : await getActiveAd(placement);
  if (!ad) return null;

  return (
    <aside
      className={cn("block", className)}
      aria-label="Sponsored"
      data-promotion-zone={placement}
    >
      <AdBanner ad={ad} placementKey={placement} />
    </aside>
  );
}

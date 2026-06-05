import type { AdPlacementKey } from "@/constants/adPlacements";
import { getActiveAd } from "@/lib/ads";
import { AdBanner } from "./ad-banner";
import { cn } from "@/lib/utils";

export async function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacementKey;
  className?: string;
}) {
  const ad = await getActiveAd(placement);
  if (!ad) return null;

  return (
    <div className={cn("px-3 lg:px-0", className)} aria-label="Advertisement">
      <AdBanner ad={ad} placementKey={placement} />
    </div>
  );
}

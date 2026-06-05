import type { AdPlacement } from "@/types/database";
import type { AdPlacementKey } from "@/constants/adPlacements";
import { AdBanner } from "./ad-banner";

export function AdFeedInsert({
  ad,
  placementKey,
}: {
  ad: AdPlacement;
  placementKey: AdPlacementKey;
}) {
  return (
    <div className="px-0" aria-label="Advertisement">
      <AdBanner ad={ad} placementKey={placementKey} />
    </div>
  );
}

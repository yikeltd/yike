import type { AdvertisementPlacement } from "@/lib/advertisements/public";
import { getSponsoredAd } from "@/lib/advertisements/public";
import { SponsoredAdBanner } from "@/components/ads/sponsored-ad-banner";
import { cn } from "@/lib/utils";

export async function SponsoredAdSlot({
  placement,
  className,
  compact,
}: {
  placement: AdvertisementPlacement;
  className?: string;
  compact?: boolean;
}) {
  const ad = await getSponsoredAd(placement);
  if (!ad) return null;

  return (
    <div
      className={cn("mx-auto max-w-7xl px-3 lg:px-6 xl:px-8", className)}
      aria-label="Sponsored opportunity"
    >
      <SponsoredAdBanner ad={ad} placement={placement} compact={compact} />
    </div>
  );
}

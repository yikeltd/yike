import type { Advertisement } from "@/types/database";
import { SponsoredAdBanner } from "@/components/ads/sponsored-ad-banner";

export function SponsoredFeedInsert({ ad }: { ad: Advertisement }) {
  return (
    <div className="px-0" aria-label="Sponsored opportunity">
      <SponsoredAdBanner ad={ad} placement="search_results" compact />
    </div>
  );
}

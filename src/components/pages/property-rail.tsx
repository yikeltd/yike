import { PropertyCard } from "@/components/property/property-card";
import {
  getPublicProperties,
  type PropertySearchParams,
} from "@/lib/properties";
import { withDemoFallback } from "@/lib/mock-listings";
import type { DiscoverHub } from "@/types/database";
import { PageSection } from "./page-section";
import {
  BROWSE_GRID_CLASS,
  BROWSE_RAIL_CARD_CLASS,
} from "@/lib/marketplace/browse-grid";

export async function PropertyRail({
  title,
  subtitle,
  seeAllHref,
  params = {},
  hub,
  limit = 10,
}: {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  params?: PropertySearchParams;
  hub?: DiscoverHub;
  limit?: number;
}) {
  const merged = hub ? { ...params, hub } : params;
  const rows = await getPublicProperties(merged, limit);
  const { items } = withDemoFallback(rows);
  if (items.length === 0) return null;

  return (
    <PageSection title={title} subtitle={subtitle} href={seeAllHref}>
      {/* Mobile/tablet: horizontal snap rail · Desktop: dense poster grid */}
      <div className="hide-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-2 sm:gap-2.5 lg:mx-0 lg:hidden lg:px-0">
        {items.map((p, i) => (
          <div key={p.id} className={BROWSE_RAIL_CARD_CLASS}>
            <PropertyCard
              property={p}
              layout="desktop"
              priorityImage={i < 2}
              inline
            />
          </div>
        ))}
      </div>
      <div className={`hidden ${BROWSE_GRID_CLASS} lg:!grid`}>
        {items.map((p, i) => (
          <PropertyCard
            key={p.id}
            property={p}
            layout="desktop"
            priorityImage={i < 6}
            inline
          />
        ))}
      </div>
    </PageSection>
  );
}

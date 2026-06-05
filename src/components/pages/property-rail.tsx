import { PropertyCard } from "@/components/property/property-card";
import {
  getPublicProperties,
  type PropertySearchParams,
} from "@/lib/properties";
import { withDemoFallback } from "@/lib/mock-listings";
import type { DiscoverHub } from "@/types/database";
import { PageSection } from "./page-section";

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
  const { items, isDemo } = withDemoFallback(rows);
  if (items.length === 0) return null;

  return (
    <PageSection title={title} subtitle={subtitle} href={seeAllHref}>
      <div className="hide-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-2 lg:mx-0 lg:gap-4 lg:px-0">
        {items.map((p, i) => (
          <div
            key={p.id}
            className="w-[min(88vw,340px)] shrink-0 snap-start lg:w-[300px]"
          >
            <PropertyCard
              property={p}
              layout="desktop"
              priorityImage={i < 2}
              inline
            />
          </div>
        ))}
      </div>
      {isDemo && (
        <p className="mt-2 px-3 text-[11px] text-muted lg:px-0">
          Live inventory updates daily across Nigeria.
        </p>
      )}
    </PageSection>
  );
}

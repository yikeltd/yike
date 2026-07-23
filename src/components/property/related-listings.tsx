import Link from "next/link";
import { getRelatedSections } from "@/lib/properties";
import type { Property } from "@/types/database";
import { PropertyCard } from "./property-card";
import { NearbyPrefetch } from "./nearby-prefetch";
import {
  BROWSE_GRID_CLASS,
  BROWSE_RAIL_CARD_CLASS,
} from "@/lib/marketplace/browse-grid";

function PropertyRail({ properties }: { properties: Property[] }) {
  return (
    <>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-2 pb-2 sm:gap-2.5 lg:hidden">
        {properties.map((p, i) => (
          <div key={p.id} className={BROWSE_RAIL_CARD_CLASS}>
            <PropertyCard
              property={p}
              layout="desktop"
              inline
              priorityImage={i < 2}
            />
          </div>
        ))}
      </div>
      <div className={`hidden ${BROWSE_GRID_CLASS} lg:!grid`}>
        {properties.map((p, i) => (
          <PropertyCard
            key={p.id}
            property={p}
            layout="desktop"
            inline
            priorityImage={i < 4}
          />
        ))}
      </div>
    </>
  );
}

export async function RelatedListings({ property }: { property: Property }) {
  const sections = await getRelatedSections(property);
  if (sections.length === 0) return null;

  const searchHref = `/search?city=${encodeURIComponent(property.city)}&area=${encodeURIComponent(property.area)}`;

  const allProps = sections.flatMap((s) => s.properties);

  return (
    <div className="mt-8 space-y-10 border-t border-surface pt-8 lg:mt-12">
      <NearbyPrefetch properties={allProps} />
      {sections.map((section) => (
        <section key={section.title}>
          <div className="mb-4 flex items-end justify-between px-4 lg:px-0">
            <div>
              <h2 className="text-lg font-bold text-navy lg:text-xl">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="mt-0.5 text-sm text-muted">{section.subtitle}</p>
              )}
            </div>
            <Link
              href={searchHref}
              className="text-sm font-bold text-gold-dark hover:underline"
            >
              See all
            </Link>
          </div>
          <PropertyRail properties={section.properties} />
        </section>
      ))}
    </div>
  );
}

import Link from "next/link";
import { getRelatedProperties } from "@/lib/properties";
import type { Property } from "@/types/database";
import { PropertyCard } from "./property-card";
import { isDemoProperty } from "@/lib/mock-listings";

export async function RelatedListings({
  property,
  title = "More homes nearby",
}: {
  property: Property;
  title?: string;
}) {
  const related = await getRelatedProperties(property, 6);
  if (related.length === 0) return null;

  const searchHref = `/search?city=${encodeURIComponent(property.city)}&area=${encodeURIComponent(property.area)}`;

  return (
    <section className="mt-8 border-t border-surface pt-8 lg:mt-12">
      <div className="mb-4 flex items-end justify-between px-4 lg:px-0">
        <div>
          <h2 className="text-lg font-bold text-navy lg:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {property.area}, {property.city}
          </p>
        </div>
        <Link
          href={searchHref}
          className="text-sm font-bold text-gold-dark hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="hide-scrollbar flex gap-4 overflow-x-auto px-2 pb-2 snap-x-mandatory lg:grid lg:grid-cols-3 lg:gap-7 lg:overflow-visible lg:px-0 xl:grid-cols-3">
        {related.map((p, i) => (
          <div
            key={p.id}
            className="w-[min(88vw,340px)] shrink-0 snap-center lg:w-auto"
          >
            <PropertyCard
              property={p}
              layout="desktop"
              inline
              priorityImage={i < 2}
            />
          </div>
        ))}
      </div>
      {isDemoProperty(property.id) && (
        <p className="mt-3 px-4 text-xs text-muted lg:px-0">
          Sample listings — connect Supabase for live inventory
        </p>
      )}
    </section>
  );
}

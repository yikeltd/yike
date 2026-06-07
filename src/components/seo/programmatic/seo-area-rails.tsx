import Link from "next/link";
import { PropertyGrid } from "@/components/property/property-grid";
import type { Property } from "@/types/database";

function Rail({
  title,
  listings,
  searchHref,
  isDemo,
}: {
  title: string;
  listings: Property[];
  searchHref: string;
  isDemo?: boolean;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-navy lg:text-lg">{title}</h2>
        <Link
          href={searchHref}
          className="text-xs font-bold text-gold-dark hover:underline"
        >
          See all →
        </Link>
      </div>
      <PropertyGrid properties={listings.slice(0, 4)} isDemo={isDemo} />
    </section>
  );
}

export function SeoAreaRails({
  featured,
  verified,
  recentlyAdded,
  searchHref,
  isDemo,
}: {
  featured: Property[];
  verified: Property[];
  recentlyAdded: Property[];
  searchHref: string;
  isDemo?: boolean;
}) {
  return (
    <>
      <Rail
        title="Featured & verified"
        listings={featured}
        searchHref={searchHref}
        isDemo={isDemo}
      />
      <Rail
        title="Verified in this area"
        listings={verified.filter(
          (p) => !featured.some((f) => f.id === p.id)
        )}
        searchHref={searchHref}
        isDemo={isDemo}
      />
      <Rail
        title="Recently added"
        listings={recentlyAdded.filter(
          (p) =>
            !featured.some((f) => f.id === p.id) &&
            !verified.some((v) => v.id === p.id)
        )}
        searchHref={searchHref}
        isDemo={isDemo}
      />
    </>
  );
}

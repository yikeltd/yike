import type { Property } from "@/types/database";
import { PropertyCard } from "./property-card";
import { FeedList } from "./feed-list";

export function PropertyGrid({
  properties,
  emptyMessage = "No listings found yet.",
  showCount,
  isDemo,
}: {
  properties: Property[];
  emptyMessage?: string;
  showCount?: boolean;
  isDemo?: boolean;
}) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-8 py-16 text-center shadow-float">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {(showCount || isDemo) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 px-0 lg:px-0">
          {showCount && (
            <p className="text-sm text-muted">
              <span className="font-bold text-navy">{properties.length}</span>{" "}
              homes
            </p>
          )}
          {isDemo && (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-dark">
              Sample listings — connect Supabase for live data
            </span>
          )}
        </div>
      )}
      {/* Desktop: 3-column grid */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-7 xl:gap-9">
        {properties.map((p, i) => (
          <div
            key={p.id}
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <PropertyCard
              property={p}
              layout="desktop"
              priorityImage={i < 3}
            />
          </div>
        ))}
      </div>
      {/* Mobile: feed */}
      <div className="lg:hidden">
        <FeedList properties={properties} />
      </div>
    </div>
  );
}

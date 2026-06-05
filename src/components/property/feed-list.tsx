"use client";

import type { Property } from "@/types/database";
import { PropertyCard } from "./property-card";

export function FeedList({ properties }: { properties: Property[] }) {
  return (
    <div className="feed-rhythm flex flex-col pb-2">
      {properties.map((p, i) => (
        <div
          key={p.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(i, 12) * 55}ms` }}
        >
          <PropertyCard
            property={p}
            layout="mobile"
            priorityImage={i < 3}
          />
        </div>
      ))}
    </div>
  );
}

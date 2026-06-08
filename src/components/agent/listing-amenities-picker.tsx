"use client";

import { useState } from "react";
import { NIGERIAN_AMENITIES } from "@/constants/amenities";
import { amenityBuckets } from "@/lib/listing-field-rules";
import type { ListingTypeValue } from "@/constants/listingTypes";
import { cn } from "@/lib/utils";

export function ListingAmenitiesPicker({
  listingType,
  propertyType,
  selected,
  onChange,
}: {
  listingType: ListingTypeValue;
  propertyType: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { primary, more } = amenityBuckets(listingType, propertyType);
  const map = new Map(NIGERIAN_AMENITIES.map((a) => [a.id, a]));

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  function renderChip(id: string) {
    const def = map.get(id as (typeof NIGERIAN_AMENITIES)[number]["id"]);
    if (!def) return null;
    const on = selected.includes(id);
    return (
      <button
        key={id}
        type="button"
        onClick={() => toggle(id)}
        className={cn(
          "pressable rounded-full px-3 py-2 text-xs font-bold",
          on ? "bg-gold text-navy shadow-glow-gold" : "bg-surface text-muted"
        )}
      >
        {def.shortLabel}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">{primary.map(renderChip)}</div>
      {more.length > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="text-xs font-bold text-gold-dark"
          >
            {moreOpen ? "Fewer amenities" : "More amenities"}
          </button>
          {moreOpen ? (
            <div className="flex flex-wrap gap-2">{more.map(renderChip)}</div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

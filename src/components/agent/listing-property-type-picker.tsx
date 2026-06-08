"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { groupsForListingType, propertyTypesForGroup } from "@/lib/listing-field-rules";
import type { ListingTypeValue } from "@/constants/listingTypes";
import { PROPERTY_CATEGORY_GROUPS } from "@/constants/propertyCategories";
import { cn } from "@/lib/utils";

export function ListingPropertyTypePicker({
  listingType,
  value,
  onChange,
}: {
  listingType: ListingTypeValue;
  value: string;
  onChange: (value: string) => void;
}) {
  const groups = groupsForListingType(listingType);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <input type="hidden" name="property_type" value={value} required />
      {PROPERTY_CATEGORY_GROUPS.filter((g) => groups.includes(g.id)).map((group) => {
        const types = propertyTypesForGroup(group.id);
        const expanded = openGroup === group.id;
        const hasActive = types.some((t) => t.value === value);
        return (
          <div
            key={group.id}
            className={cn(
              "overflow-hidden rounded-xl border transition-colors",
              hasActive ? "border-gold/40 bg-gold/5" : "border-navy/10 bg-surface"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenGroup(expanded ? null : group.id)}
              className="pressable flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="text-sm font-bold text-navy">{group.label}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </button>
            {expanded ? (
              <div className="flex flex-wrap gap-1.5 border-t border-navy/8 px-2 pb-2 pt-1">
                {types.map((t) => {
                  const active = value === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => onChange(t.value)}
                      className={cn(
                        "pressable rounded-full px-3 py-1.5 text-xs font-bold",
                        active
                          ? "bg-gold text-navy shadow-glow-gold"
                          : "bg-white text-muted ring-1 ring-navy/10"
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

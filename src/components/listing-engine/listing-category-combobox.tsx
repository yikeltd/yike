"use client";

import { Building2, Car, Smartphone } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import type { ListingCategoryId } from "@/lib/listing-engine";
import { isListingCategoryCreatable } from "@/lib/listing-engine/category-availability";
import { cn } from "@/lib/utils";

const CATEGORY_META: {
  id: ListingCategoryId;
  label: string;
  keywords: string;
  icon: typeof Car;
}[] = [
  {
    id: "property",
    label: "Property",
    keywords: "rent buy sale shortlet land commercial residential",
    icon: Building2,
  },
  {
    id: "vehicle",
    label: "Vehicles",
    keywords: "car suv truck bus motorcycle pickup equipment",
    icon: Car,
  },
  {
    id: "electronics",
    label: "Electronics",
    keywords: "phone laptop tv appliance generator camera",
    icon: Smartphone,
  },
];

export function listingCategoryOptions() {
  return CATEGORY_META.filter((c) => isListingCategoryCreatable(c.id)).map((c) => ({
    value: c.id,
    label: `${c.label} — ${c.keywords.split(" ").slice(0, 4).join(", ")}…`,
  }));
}

export function ListingCategoryCombobox({
  value,
  onChange,
  className,
}: {
  value: ListingCategoryId;
  onChange: (id: ListingCategoryId) => void;
  className?: string;
}) {
  const options = listingCategoryOptions();
  const selected = CATEGORY_META.find((c) => c.id === value);
  const Icon = selected?.icon ?? Building2;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor="listing-category-select" className="text-xs font-bold uppercase tracking-wide text-navy/70">
        Category
      </label>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <ThemedSelect
            value={value}
            onChange={(v) => onChange(v as ListingCategoryId)}
            options={options}
            placeholder="Search property, vehicles, electronics…"
            ariaLabel="Listing category"
            searchable
          />
        </div>
      </div>
    </div>
  );
}

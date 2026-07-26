"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type QuickFilterChip = {
  id: string;
  label: string;
  /** Query keys to set (merged onto /vehicles or /search). */
  params: Record<string, string>;
  /** When true, chip is active if all params match. */
};

export const VEHICLE_QUICK_FILTERS: QuickFilterChip[] = [
  { id: "verified", label: "Verified", params: { verified: "1" } },
  { id: "auto", label: "Automatic", params: { transmission: "automatic" } },
  { id: "diesel", label: "Diesel", params: { fuel: "diesel" } },
  { id: "electric", label: "Electric", params: { fuel: "electric" } },
  { id: "suv", label: "SUV", params: { category: "suv" } },
  { id: "pickup", label: "Pickup", params: { category: "truck" } },
  { id: "luxury", label: "Luxury", params: { make: "Mercedes-Benz" } },
  {
    id: "registered",
    label: "Registered",
    params: { condition: "nigerian_used" },
  },
  {
    id: "low-km",
    label: "Low Mileage",
    params: { max_mileage: "80000" },
  },
  { id: "commercial", label: "Commercial", params: { category: "commercial" } },
  { id: "under5", label: "Under ₦5M", params: { max_price: "5000000" } },
  { id: "newest", label: "Newest", params: { sort: "newest" } },
];

export const PROPERTY_QUICK_FILTERS: QuickFilterChip[] = [
  { id: "verified", label: "Verified", params: { verified: "1" } },
  { id: "rent", label: "For Rent", params: { type: "rent" } },
  { id: "sale", label: "For Sale", params: { type: "sale" } },
  { id: "duplex", label: "Duplex", params: { property_type: "detached_duplex" } },
  { id: "flat", label: "Apartment", params: { property_type: "flat_2" } },
  { id: "land", label: "Land", params: { property_type: "land" } },
  { id: "shortlet", label: "Short Let", params: { type: "shortlet" } },
  { id: "commercial", label: "Commercial", params: { property_type: "shop" } },
  { id: "under50", label: "Under ₦50M", params: { max: "50000000" } },
];

function buildHref(
  base: string,
  chip: QuickFilterChip,
  current: URLSearchParams,
): string {
  const next = new URLSearchParams(current.toString());
  next.delete("page");
  for (const [k, v] of Object.entries(chip.params)) {
    next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

function isActive(chip: QuickFilterChip, current: URLSearchParams): boolean {
  return Object.entries(chip.params).every(
    ([k, v]) => current.get(k)?.toLowerCase() === v.toLowerCase(),
  );
}

/** Horizontal discovery chips — URL params only, existing filters. */
export function QuickFilterChips({
  chips,
  basePath,
  className,
}: {
  chips: readonly QuickFilterChip[];
  basePath: "/vehicles" | "/search";
  className?: string;
  /** @deprecated Unused — chips speak for themselves */
  label?: string;
}) {
  const searchParams = useSearchParams();

  return (
    <div className={cn(className)}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => {
          const active = isActive(chip, searchParams);
          return (
            <Link
              key={chip.id}
              href={buildHref(basePath, chip, searchParams)}
              className={cn(
                "pressable inline-flex shrink-0 items-center rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm transition hover:-translate-y-px",
                active
                  ? "border-navy bg-navy text-gold"
                  : "border-navy/10 bg-white text-navy hover:border-gold/40 hover:shadow-md",
              )}
            >
              {chip.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

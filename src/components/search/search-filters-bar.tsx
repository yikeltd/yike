"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROPERTY_TYPES } from "@/constants/propertyCategories";
import { SEARCH_DEAL_TYPES } from "@/constants/listingTypes";
import { FILTER_AMENITIES, getAmenityShortLabel } from "@/constants/amenities";
import { BEDROOM_OPTIONS, BATHROOM_OPTIONS } from "@/lib/search-filters";
import { cn } from "@/lib/utils";
import { ShieldCheck, Star } from "lucide-react";

export function SearchFiltersBar({ className }: { className?: string }) {
  const router = useRouter();
  const sp = useSearchParams();

  function set(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/search?${params.toString()}`);
  }

  function toggle(key: string) {
    const params = new URLSearchParams(sp.toString());
    if (params.get(key) === "1") params.delete(key);
    else params.set(key, "1");
    router.push(`/search?${params.toString()}`);
  }

  const verified = sp.get("verified") === "1";
  const featured = sp.get("featured") === "1";
  const activeAmenity = sp.get("amenity") ?? "";

  return (
    <div
      className={cn(
        "hide-scrollbar flex gap-2 overflow-x-auto px-3 pb-2 lg:flex-wrap lg:px-0",
        className
      )}
    >
      <select
        value={sp.get("type") ?? ""}
        onChange={(e) => set("type", e.target.value)}
        className="h-9 shrink-0 rounded-full bg-white px-3 text-xs font-semibold text-navy shadow-float outline-none"
      >
        <option value="">Deal type</option>
        {SEARCH_DEAL_TYPES.map((t) => (
          <option key={t.label} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        value={sp.get("property_type") ?? ""}
        onChange={(e) => set("property_type", e.target.value)}
        className="h-9 shrink-0 rounded-full bg-white px-3 text-xs font-semibold text-navy shadow-float outline-none"
      >
        <option value="">Property type</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        value={sp.get("beds") ?? ""}
        onChange={(e) => set("beds", e.target.value)}
        className="h-9 shrink-0 rounded-full bg-white px-3 text-xs font-semibold text-navy shadow-float outline-none"
      >
        {BEDROOM_OPTIONS.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        value={sp.get("baths") ?? ""}
        onChange={(e) => set("baths", e.target.value)}
        className="h-9 shrink-0 rounded-full bg-white px-3 text-xs font-semibold text-navy shadow-float outline-none"
      >
        {BATHROOM_OPTIONS.map((o) => (
          <option key={o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => toggle("verified")}
        className={cn(
          "pressable flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold shadow-float",
          verified ? "bg-gold text-navy" : "bg-white text-muted"
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Verified
      </button>
      <button
        type="button"
        onClick={() => toggle("featured")}
        className={cn(
          "pressable flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold shadow-float",
          featured ? "bg-gold text-navy" : "bg-white text-muted"
        )}
      >
        <Star className="h-3.5 w-3.5" />
        Featured
      </button>
      {FILTER_AMENITIES.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => set("amenity", activeAmenity === id ? "" : id)}
          className={cn(
            "pressable h-9 shrink-0 rounded-full px-3 text-xs font-bold shadow-float",
            activeAmenity === id ? "bg-navy text-white" : "bg-white text-muted"
          )}
        >
          {getAmenityShortLabel(id)}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { VEHICLE_CATEGORIES } from "@/lib/marketplace/vehicle-specs";
import { POPULAR_VEHICLE_MAKES } from "@/lib/marketplace/vehicle-makes";
import { NIGERIAN_STATES } from "@/lib/constants";
import { SearchFilterChips } from "@/components/search/search-filter-chips";
import { getMarketplaceLocation } from "@/lib/marketplace-location/preference";
import { cn } from "@/lib/utils";

const controlClass =
  "min-h-11 w-full rounded-xl border border-navy/10 bg-white px-3 text-sm text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

function first(v: string | null): string {
  return v ?? "";
}

export function VehicleSearchPanel({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(defaultOpen);
  const [moreOpen, setMoreOpen] = useState(() =>
    Boolean(sp.get("model") || sp.get("min_price") || sp.get("max_price")),
  );

  const verified = sp.get("verified") === "1";
  const featured = sp.get("featured") === "1";
  const nearby = sp.get("nearby") === "1";
  const condition = sp.get("condition") ?? "";
  const usedActive =
    condition === "used" ||
    condition === "nigerian_used" ||
    condition === "foreign_used";
  const newActive = condition === "new";

  function push(updates: Record<string, string | null>, replaceBase = false) {
    const params = replaceBase
      ? new URLSearchParams()
      : new URLSearchParams(sp.toString());
    params.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/vehicles?${qs}` : "/vehicles");
  }

  function toggleFlag(key: "verified" | "featured") {
    push({ [key]: sp.get(key) === "1" ? null : "1" });
  }

  function toggleNearby() {
    if (nearby) {
      push({ nearby: null });
      return;
    }
    const loc = getMarketplaceLocation();
    push({
      nearby: "1",
      ...(loc?.city ? { city: loc.city } : {}),
      ...(loc?.state ? { state: loc.state } : {}),
    });
  }

  function toggleCondition(value: "new" | "used") {
    if (
      (value === "new" && newActive) ||
      (value === "used" && usedActive)
    ) {
      push({ condition: null });
      return;
    }
    push({ condition: value });
  }

  const chips = [
    {
      id: "verified",
      label: "Verified",
      active: verified,
      onToggle: () => toggleFlag("verified"),
    },
    {
      id: "featured",
      label: "Featured",
      active: featured,
      onToggle: () => toggleFlag("featured"),
    },
    {
      id: "nearby",
      label: "Nearby",
      active: nearby,
      onToggle: toggleNearby,
    },
    {
      id: "used",
      label: "Used",
      active: usedActive,
      onToggle: () => toggleCondition("used"),
    },
    {
      id: "new",
      label: "New",
      active: newActive,
      onToggle: () => toggleCondition("new"),
    },
  ];

  function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string | null> = {};
    for (const key of [
      "q",
      "category",
      "make",
      "model",
      "state",
      "min_price",
      "max_price",
      "sort",
    ] as const) {
      const v = String(fd.get(key) ?? "").trim();
      next[key] = v || null;
    }
    if (verified) next.verified = "1";
    if (featured) next.featured = "1";
    if (nearby) next.nearby = "1";
    if (condition) next.condition = condition;
    if (sp.get("city")) next.city = sp.get("city");
    push(next, true);
  }

  return (
    <div className="mb-2 overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-[0_4px_20px_rgba(3,27,78,0.05)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pressable flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-navy">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gold" />
          Search
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-navy/40 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <form
          className="space-y-2.5 border-t border-navy/6 px-3 pb-3 pt-2.5"
          onSubmit={submitForm}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input
              name="q"
              defaultValue={first(sp.get("q"))}
              placeholder="Make, model…"
              className={cn(controlClass, "col-span-2")}
              aria-label="Search vehicles"
            />
            <select
              name="category"
              defaultValue={first(sp.get("category"))}
              className={controlClass}
              aria-label="Category"
            >
              <option value="">Category</option>
              {VEHICLE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.plural}
                </option>
              ))}
            </select>
            <select
              name="make"
              defaultValue={first(sp.get("make"))}
              className={controlClass}
              aria-label="Make"
            >
              <option value="">Make</option>
              {POPULAR_VEHICLE_MAKES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              name="state"
              defaultValue={first(sp.get("state"))}
              className={controlClass}
              aria-label="Location"
            >
              <option value="">Location</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={first(sp.get("sort")) || "newest"}
              className={controlClass}
              aria-label="Sort"
            >
              <option value="newest">Newest</option>
              <option value="featured">Featured</option>
              <option value="price_asc">Price · low → high</option>
              <option value="price_desc">Price · high → low</option>
            </select>
            <button
              type="submit"
              className="pressable min-h-11 rounded-xl bg-navy px-4 text-sm font-bold text-white"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="pressable inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-navy/10 bg-white px-3 text-xs font-semibold text-navy/65"
              aria-expanded={moreOpen}
            >
              More
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  moreOpen && "rotate-180"
                )}
              />
            </button>
          </div>

          {moreOpen ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <input
                name="model"
                defaultValue={first(sp.get("model"))}
                placeholder="Model"
                className={controlClass}
                aria-label="Model"
              />
              <input
                name="min_price"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={first(sp.get("min_price"))}
                placeholder="Min ₦"
                className={controlClass}
                aria-label="Minimum price"
              />
              <input
                name="max_price"
                type="number"
                inputMode="numeric"
                min={0}
                defaultValue={first(sp.get("max_price"))}
                placeholder="Max ₦"
                className={cn(controlClass, "col-span-2 sm:col-span-1")}
                aria-label="Maximum price"
              />
            </div>
          ) : (
            <>
              <input type="hidden" name="model" value={first(sp.get("model"))} />
              <input
                type="hidden"
                name="min_price"
                value={first(sp.get("min_price"))}
              />
              <input
                type="hidden"
                name="max_price"
                value={first(sp.get("max_price"))}
              />
            </>
          )}

          <SearchFilterChips chips={chips} />
        </form>
      ) : (
        <div className="border-t border-navy/6 px-3 py-2.5">
          <SearchFilterChips chips={chips} />
        </div>
      )}
    </div>
  );
}

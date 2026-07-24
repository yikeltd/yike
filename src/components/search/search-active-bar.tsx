"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { hubLabel } from "@/constants/listingTypes";
import { budgetLabelFromParams } from "@/lib/search-summary";
import { cn } from "@/lib/utils";

const PILL_KEYS: { key: string; label: (v: string) => string }[] = [
  { key: "type", label: (v) => (v === "sale" ? "For Sale" : v === "rent" ? "For Rent" : v) },
  {
    key: "hub",
    label: (v) => hubLabel(v as Parameters<typeof hubLabel>[0]) ?? v,
  },
  { key: "city", label: (v) => v },
  { key: "area", label: (v) => v },
  { key: "state", label: (v) => v },
  { key: "property_type", label: (v) => v.replace(/_/g, " ") },
  { key: "beds", label: (v) => `${v} bed` },
  { key: "baths", label: (v) => `${v} bath` },
  { key: "q", label: (v) => `"${v}"` },
];

export function SearchActiveBar({
  resultCount,
  nearbyCount = 0,
  showingFallback = false,
  currentHref: _currentHref,
  currentLabel: _currentLabel,
  compact,
  className,
}: {
  resultCount: number;
  nearbyCount?: number;
  showingFallback?: boolean;
  currentHref?: string;
  currentLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  void _currentHref;
  void _currentLabel;
  const router = useRouter();
  const sp = useSearchParams();

  function removeKey(key: string) {
    const params = new URLSearchParams(sp.toString());
    params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  function clearAll() {
    router.push("/search");
  }

  const pills = PILL_KEYS.flatMap(({ key, label }) => {
    const value = sp.get(key);
    if (!value) return [];
    if (key === "hub" && sp.get("type")) return [];
    return [{ key, text: label(value) }];
  });

  if (sp.get("verified") === "1") pills.push({ key: "verified", text: "Verified" });
  if (sp.get("featured") === "1") pills.push({ key: "featured", text: "Featured" });
  if (sp.get("nearby") === "1") pills.push({ key: "nearby", text: "Nearby" });
  if (sp.get("min") || sp.get("max")) {
    const label =
      budgetLabelFromParams(sp.get("min"), sp.get("max")) ?? "Budget";
    pills.push({ key: "budget", text: label });
  }

  const hasFilters = pills.length > 0;
  const count = showingFallback ? nearbyCount : resultCount;
  const summary = showingFallback
    ? `${count} Results Nearby`
    : sp.get("nearby") === "1"
      ? `${count} Results Nearby`
      : `${count} Results`;

  return (
    <div
      className={cn(
        "px-3 lg:px-6 xl:px-8",
        compact ? "py-2" : "py-2.5",
        className
      )}
    >
      <div className="w-full lg:mx-auto lg:max-w-7xl">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold tracking-tight text-navy lg:text-[15px]">
            {summary}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="pressable rounded-full px-2.5 py-1 text-xs font-semibold text-navy/45 hover:text-navy"
            >
              Clear
            </button>
          ) : null}
        </div>

        {hasFilters ? (
          <div className="hide-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
            {pills.map((pill) => (
              <button
                key={`${pill.key}-${pill.text}`}
                type="button"
                onClick={() => {
                  if (pill.key === "budget") {
                    const params = new URLSearchParams(sp.toString());
                    params.delete("min");
                    params.delete("max");
                    const qs = params.toString();
                    router.push(qs ? `/search?${qs}` : "/search");
                    return;
                  }
                  removeKey(pill.key);
                }}
                className="pressable inline-flex shrink-0 items-center gap-1 rounded-full bg-navy/[0.06] px-2.5 py-1 text-[11px] font-semibold text-navy/80"
              >
                <span className="capitalize">{pill.text}</span>
                <X className="h-2.5 w-2.5 opacity-50" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

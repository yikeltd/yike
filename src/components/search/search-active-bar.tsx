"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { hubLabel } from "@/constants/listingTypes";
import { formatSearchFilterSummary } from "@/lib/search-summary";
import { SaveSearchButton } from "./save-search-button";
import { cn } from "@/lib/utils";

const PILL_KEYS: { key: string; label: (v: string) => string }[] = [
  { key: "type", label: (v) => v },
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
  currentHref,
  currentLabel,
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
  const router = useRouter();
  const sp = useSearchParams();
  const summary = formatSearchFilterSummary(sp);

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
  if (sp.get("min") || sp.get("max")) {
    const min = sp.get("min");
    const max = sp.get("max");
    pills.push({
      key: "budget",
      text: [min && `₦${Number(min).toLocaleString()}+`, max && `≤₦${Number(max).toLocaleString()}`]
        .filter(Boolean)
        .join(" "),
    });
  }

  const hasFilters = pills.length > 0;

  return (
    <div
      className={cn(
        "border-b border-navy/8 bg-white/95 px-3 backdrop-blur-sm lg:px-6 xl:px-8",
        compact ? "py-2.5" : "py-3",
        className
      )}
    >
      <div className="w-full lg:max-w-7xl lg:mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy/45">
          Search results
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-foreground lg:text-base">
            {showingFallback
              ? `No exact matches · ${nearbyCount} nearby in your area`
              : `${resultCount} ${resultCount === 1 ? "listing" : "listings"} found`}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {currentHref && currentLabel ? (
              <SaveSearchButton
                label={currentLabel}
                href={currentHref}
                compact
                className="!px-2 !py-1"
              />
            ) : null}
            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="pressable rounded-full px-2.5 py-1 text-xs font-bold text-muted hover:text-foreground"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {summary ? (
          <p className="mt-1 truncate text-xs text-muted">{summary}</p>
        ) : null}

        {hasFilters ? (
          <div className="hide-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
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
                  if (pill.key === "verified" || pill.key === "featured") {
                    removeKey(pill.key);
                    return;
                  }
                  removeKey(pill.key);
                }}
                className="pressable inline-flex shrink-0 items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-white"
              >
                <span className="capitalize">{pill.text}</span>
                <X className="h-2.5 w-2.5 opacity-70" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

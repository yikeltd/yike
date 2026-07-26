"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { budgetLabelFromParams } from "@/lib/search-summary";
import { vehicleCategoryLabel } from "@/lib/marketplace/vehicle-specs";
import { cn } from "@/lib/utils";

const PILL_KEYS: { key: string; label: (v: string) => string }[] = [
  { key: "q", label: (v) => `"${v}"` },
  {
    key: "category",
    label: (v) => vehicleCategoryLabel(v) || v,
  },
  { key: "make", label: (v) => v },
  { key: "model", label: (v) => v },
  { key: "city", label: (v) => v },
  { key: "state", label: (v) => v },
  {
    key: "condition",
    label: (v) => v.replace(/_/g, " "),
  },
  { key: "transmission", label: (v) => v },
  { key: "fuel", label: (v) => v },
];

/** Same chrome as SearchActiveBar — vehicle query keys. */
export function VehicleActiveBar({
  resultCount,
  compact,
  className,
}: {
  resultCount: number;
  compact?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function removeKey(key: string) {
    const params = new URLSearchParams(sp.toString());
    params.delete(key);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/vehicles?${qs}` : "/vehicles");
  }

  function clearAll() {
    router.push("/vehicles");
  }

  const pills = PILL_KEYS.flatMap(({ key, label }) => {
    const value = sp.get(key);
    if (!value) return [];
    return [{ key, text: label(value) }];
  });

  if (sp.get("verified") === "1") pills.push({ key: "verified", text: "Verified" });
  if (sp.get("featured") === "1") pills.push({ key: "featured", text: "Featured" });
  if (sp.get("nearby") === "1") pills.push({ key: "nearby", text: "Nearby" });
  if (sp.get("min_price") || sp.get("max_price")) {
    const label =
      budgetLabelFromParams(sp.get("min_price"), sp.get("max_price")) ??
      "Budget";
    pills.push({ key: "budget", text: label });
  }
  if (sp.get("min_year") || sp.get("max_year")) {
    const min = sp.get("min_year");
    const max = sp.get("max_year");
    const text =
      min && max && min === max
        ? min
        : min && max
          ? `${min}–${max}`
          : min
            ? `${min}+`
            : `–${max}`;
    pills.push({ key: "year", text });
  }

  const hasFilters = pills.length > 0;
  const summary =
    sp.get("nearby") === "1"
      ? `${resultCount} Results Nearby`
      : `${resultCount} Results`;

  return (
    <div
      className={cn(
        "px-3 lg:px-6 xl:px-8",
        compact ? "py-2" : "py-2.5",
        className,
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
                    params.delete("min_price");
                    params.delete("max_price");
                    params.delete("page");
                    const qs = params.toString();
                    router.push(qs ? `/vehicles?${qs}` : "/vehicles");
                    return;
                  }
                  if (pill.key === "year") {
                    const params = new URLSearchParams(sp.toString());
                    params.delete("min_year");
                    params.delete("max_year");
                    params.delete("page");
                    const qs = params.toString();
                    router.push(qs ? `/vehicles?${qs}` : "/vehicles");
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

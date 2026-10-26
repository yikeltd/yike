"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ELECTRONICS_CATEGORIES } from "@/lib/marketplace/electronics-specs";
import { cn } from "@/lib/utils";

function categoryLabel(id: string): string {
  return ELECTRONICS_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

const PILL_KEYS: { key: string; label: (v: string) => string }[] = [
  { key: "q", label: (v) => `"${v}"` },
  { key: "category", label: categoryLabel },
  { key: "brand", label: (v) => v },
  { key: "city", label: (v) => v },
  { key: "state", label: (v) => v },
  { key: "condition", label: (v) => v.replace(/_/g, " ") },
];

export function ElectronicsActiveBar({
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
    const qs = params.toString();
    router.push(qs ? `/electronics?${qs}` : "/electronics");
  }

  function clearAll() {
    router.push("/electronics");
  }

  const pills = PILL_KEYS.flatMap(({ key, label }) => {
    const v = sp.get(key);
    if (!v) return [];
    return [{ key, text: label(v) }];
  });

  return (
    <div
      className={cn(
        "mx-3 mb-2 flex flex-wrap items-center gap-2 lg:mx-6 xl:mx-8",
        compact && "text-xs",
        className,
      )}
      data-testid="electronics-active-bar"
    >
      <span className="text-sm font-bold text-navy">
        {resultCount} {resultCount === 1 ? "listing" : "listings"}
      </span>
      {pills.map(({ key, text }) => (
        <button
          key={key}
          type="button"
          onClick={() => removeKey(key)}
          className="pressable inline-flex items-center gap-1 rounded-full border border-navy/10 bg-white px-2.5 py-1 text-xs font-semibold text-navy"
        >
          {text}
          <X className="h-3 w-3 text-navy/50" aria-hidden />
        </button>
      ))}
      {pills.length > 0 ? (
        <button
          type="button"
          onClick={clearAll}
          className="pressable text-xs font-semibold text-gold underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}

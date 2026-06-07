"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { PROPERTY_CATEGORIES } from "@/constants/propertyCategories";
import { POPULAR_AREAS } from "@/constants/popularAreas";
import {
  addRecentSearch,
  getRecentSearches,
  type RecentSearch,
} from "@/lib/search-recent";
import { cn } from "@/lib/utils";

const PRIMARY_SUGGESTIONS = [
  {
    label: "Ogbor Hill · Aba",
    href: "/search?city=Aba&area=Ogbor%20Hill",
  },
  {
    label: "Self contain · Enugu",
    href: "/search?city=Enugu&property_type=self_contain",
  },
  {
    label: "Shops · Ariaria",
    href: "/search?city=Aba&area=Ariaria&property_type=shop",
  },
  {
    label: "New Haven · Enugu",
    href: "/search?city=Enugu&area=New%20Haven",
  },
  {
    label: "Lekki · Lagos",
    href: "/search?city=Lagos&area=Lekki",
  },
] as const;

const MORE_TYPES = PROPERTY_CATEGORIES.filter((c) =>
  ["self_contain", "mini_flat", "flat_2", "flat", "shop", "land"].includes(c.value)
);

const MORE_AREAS = POPULAR_AREAS.slice(5, 14);

export function SearchSuggestions({
  variant = "footer",
}: {
  variant?: "empty" | "footer";
}) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const isEmpty = variant === "empty";

  useEffect(() => {
    setRecent(getRecentSearches().slice(0, 3));
  }, []);

  function go(href: string, label: string) {
    addRecentSearch({ label, href });
    router.push(href);
  }

  return (
    <section
      className={cn(
        "w-full px-3 lg:px-6 xl:px-8",
        isEmpty ? "py-6" : "pb-4 pt-2"
      )}
    >
      {isEmpty ? (
        <div className="rounded-2xl border border-navy/8 bg-white px-4 py-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            Start with a location or property type
          </p>
          <p className="mt-1 text-xs text-muted">Suggested</p>
          <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
            {PRIMARY_SUGGESTIONS.map((s) => (
              <button
                key={s.href}
                type="button"
                onClick={() => go(s.href, s.label)}
                className="pressable shrink-0 rounded-full border border-navy/10 bg-navy/[0.04] px-3.5 py-2 text-xs font-semibold text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-navy/8 bg-white/80 px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-navy/45">
              Suggestions
            </p>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="pressable flex items-center gap-1 text-[11px] font-bold text-navy/60"
              aria-expanded={moreOpen}
            >
              More suggestions
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  moreOpen && "rotate-180"
                )}
              />
            </button>
          </div>
          <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-0.5">
            {PRIMARY_SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s.href}
                type="button"
                onClick={() => go(s.href, s.label)}
                className="pressable shrink-0 rounded-full bg-navy/[0.05] px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>

          {moreOpen && (
            <div className="mt-3 space-y-3 border-t border-navy/8 pt-3">
              {recent.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    Recent
                  </p>
                  <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                    {recent.map((r) => (
                      <button
                        key={r.href}
                        type="button"
                        onClick={() => router.push(r.href)}
                        className="pressable shrink-0 rounded-full border border-dashed border-navy/15 px-3 py-1.5 text-xs font-medium text-foreground"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Property types
                </p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {MORE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() =>
                        go(
                          `/search?property_type=${encodeURIComponent(t.value)}`,
                          t.label
                        )
                      }
                      className="pressable shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  Areas
                </p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {MORE_AREAS.map((a) => (
                    <button
                      key={a.href}
                      type="button"
                      onClick={() => go(a.href, a.label)}
                      className="pressable shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
                    >
                      {a.area}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

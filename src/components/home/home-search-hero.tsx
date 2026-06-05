"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BUDGET_RANGES,
  getAreasForSearchCity,
  POPULAR_CITIES,
} from "@/lib/constants";
import {
  SEARCH_DEAL_TYPES,
  findDealChip,
} from "@/constants/listingTypes";
import { trackEvent } from "@/lib/analytics";
import { saveBrowsePreferences } from "@/lib/browse-preferences";
import { addRecentSearch } from "@/lib/search-recent";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/design/tokens";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

type Initial = {
  listingType?: string;
  hub?: string;
  city?: string;
  area?: string;
  min?: string;
  max?: string;
};

function hasActiveFilters(initial?: Initial) {
  return Boolean(
    initial?.city ||
      initial?.area ||
      initial?.min ||
      initial?.max
  );
}

function chipValueFromInitial(initial?: Initial) {
  if (initial?.hub === "land_sale") return "land";
  return initial?.listingType ?? "";
}

export function HomeSearchHero({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dealChip, setDealChip] = useState(chipValueFromInitial(initial));
  const [city, setCity] = useState(initial?.city ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [budget, setBudget] = useState("0");
  const [expanded, setExpanded] = useState(hasActiveFilters(initial));
  const areas = city ? getAreasForSearchCity(city) : [];

  useEffect(() => {
    const type = searchParams.get("type") ?? "";
    const hub = searchParams.get("hub");
    const c = searchParams.get("city") ?? "";
    const a = searchParams.get("area") ?? "";
    const min = searchParams.get("min");
    const max = searchParams.get("max");
    setDealChip(hub === "land_sale" ? "land" : type);
    setCity(c);
    setArea(a);
    setExpanded(Boolean(c || a || min || max));
    const idx = BUDGET_RANGES.findIndex(
      (b) =>
        (min ? String(b.min) === min : !b.min) &&
        (max ? String(b.max) === max : !b.max)
    );
    if (idx >= 0) setBudget(String(idx));
  }, [searchParams]);

  function applyFilters() {
    const params = new URLSearchParams();
    const chip = findDealChip(dealChip, dealChip === "land" ? "land_sale" : null);

    if (chip?.hub) params.set("hub", chip.hub);
    else if (dealChip) params.set("type", dealChip);

    if (city) params.set("city", city);
    if (area.trim()) params.set("area", area.trim());
    const range = BUDGET_RANGES[Number(budget)];
    if (range?.min) params.set("min", String(range.min));
    if (range?.max) params.set("max", String(range.max));

    const chipLabel =
      findDealChip(dealChip, dealChip === "land" ? "land_sale" : null)?.label ??
      "All";

    const label =
      [city, area.trim()].filter(Boolean).join(" · ") ||
      chipLabel ||
      "All Nigeria";

    trackEvent("search", {
      city: city || undefined,
      area: area.trim() || undefined,
      listing_type: chip?.hub ? undefined : dealChip || undefined,
      budget: range?.label,
      placement: "home_hero",
    });

    saveBrowsePreferences({
      city: city || undefined,
      area: area.trim() || undefined,
      listingType: chip?.hub ? undefined : dealChip || undefined,
    });

    addRecentSearch({ label, href: `/?${params.toString()}` });

    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  function onCityChange(value: string) {
    setCity(value);
    setArea("");
    if (value) setExpanded(true);
  }

  const fieldClass =
    "h-12 w-full rounded-xl border border-white/10 bg-elevated px-4 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-gold/50 dark:bg-[#122746] dark:text-[#f4f7fb]";

  return (
    <div className="relative overflow-hidden px-3 pb-4 pt-2 lg:px-0 lg:pb-5 lg:pt-4">
      <div className="relative mb-3 hidden items-center justify-between lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src={brand.logoSm}
            alt="Yike"
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="text-lg font-bold text-white">{brand.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="text-sm font-medium text-white/75 transition-colors hover:text-white"
          >
            Swipe
          </Link>
          <Link
            href="/explore"
            className="text-sm font-medium text-white/75 transition-colors hover:text-white"
          >
            Explore
          </Link>
          <ThemeToggle inverted />
          <Link
            href="/post-property"
            className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy shadow-glow-gold"
          >
            List Property
          </Link>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-gold/20 blur-3xl"
        aria-hidden
      />

      <div className="relative hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {SEARCH_DEAL_TYPES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setDealChip(t.hub ? "land" : t.value)}
            className={cn(
              "pressable shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
              (t.hub ? dealChip === "land" : dealChip === t.value)
                ? "bg-gold text-navy shadow-glow-gold"
                : "bg-white/10 text-white ring-1 ring-white/15"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="relative mt-3 space-y-2">
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          aria-label="City"
          className={fieldClass}
        >
          <option value="">All cities</option>
          {POPULAR_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div
          className={cn(
            "grid gap-2 overflow-hidden transition-all duration-300 ease-out sm:grid-cols-2 lg:grid-cols-3 lg:gap-3",
            expanded
              ? "max-h-40 opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          )}
          aria-hidden={!expanded}
        >
          {areas.length > 0 ? (
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-label="Area or neighbourhood"
              className={fieldClass}
              tabIndex={expanded ? 0 : -1}
            >
              <option value="">Area or neighbourhood</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area or neighbourhood"
              aria-label="Area or neighbourhood"
              className={fieldClass}
              tabIndex={expanded ? 0 : -1}
            />
          )}

          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            aria-label="Budget"
            className={fieldClass}
            tabIndex={expanded ? 0 : -1}
          >
            {BUDGET_RANGES.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            tabIndex={expanded ? 0 : -1}
            className="pressable flex h-12 items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-navy shadow-glow-gold sm:col-span-2 lg:col-span-1"
          >
            <Search className="h-4 w-4" />
            Search homes
          </button>
        </div>
      </form>
    </div>
  );
}

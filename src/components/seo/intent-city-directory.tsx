"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  getIntentCitiesGroupedByState,
  intentDirectoryDescription,
  intentDirectoryTitle,
  intentInCityPath,
  type SeoListingIntent,
} from "@/lib/seo/intent-in-city";

export function IntentCityDirectory({ intent }: { intent: SeoListingIntent }) {
  const grouped = useMemo(() => getIntentCitiesGroupedByState(), []);
  const totalCities = useMemo(
    () => grouped.reduce((sum, g) => sum + g.cities.length, 0),
    [grouped]
  );
  const [query, setQuery] = useState("");

  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalized) return grouped;
    return grouped
      .map((group) => ({
        ...group,
        cities: group.cities.filter(
          (c) =>
            c.city.toLowerCase().includes(normalized) ||
            c.state.toLowerCase().includes(normalized) ||
            c.slug.includes(normalized)
        ),
      }))
      .filter((g) => g.cities.length > 0);
  }, [grouped, normalized]);

  return (
    <section className="mx-auto mt-10 max-w-7xl px-3 lg:px-8">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-navy lg:text-2xl">
          {intentDirectoryTitle(intent)}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted lg:text-base">
          {intentDirectoryDescription(intent, totalCities)}
        </p>

        <label className="relative mt-5 block">
          <span className="sr-only">Search cities</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or state — e.g. Aba, Enugu, Kaduna"
            className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-navy placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </label>

        <p className="mt-3 text-xs text-muted">
          {filtered.reduce((n, g) => n + g.cities.length, 0)} locations
          {normalized ? " matching your search" : ` across ${grouped.length} states`}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((group) => (
            <details
              key={group.state}
              open={normalized.length > 0 ? true : undefined}
              className="group rounded-2xl border border-border bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <span className="font-bold text-navy">{group.state}</span>
                <span className="text-xs font-semibold text-muted">
                  {group.cities.length} {group.cities.length === 1 ? "area" : "areas"}
                </span>
              </summary>
              <ul className="grid gap-2 border-t border-border px-3 pb-4 pt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:px-4">
                {group.cities.map((row) => (
                  <li key={row.slug}>
                    <Link
                      href={intentInCityPath(intent, row.slug)}
                      className="block rounded-xl border border-transparent bg-surface/80 px-3 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-gold/35 hover:bg-gold/5"
                    >
                      {row.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">
          No cities match &ldquo;{query}&rdquo;. Try a state name or major town.
        </p>
      ) : null}
    </section>
  );
}

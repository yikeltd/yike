"use client";

import Link from "next/link";
import type { Property } from "@/types/database";
import { PropertyGrid } from "@/components/property/property-grid";
import { formatPrice } from "@/lib/utils";
import { listingPath } from "@/lib/marketplace/listing-path";

/** Desktop fallback — Discover swipe is a mobile signature experience. */
export function DiscoverDesktopFallback({
  items,
}: {
  items: Property[];
}) {
  return (
    <div className="hidden lg:block">
      <section className="relative overflow-hidden rounded-[2rem] bg-navy px-10 py-14 text-white shadow-[0_32px_80px_-24px_rgba(2,20,51,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_20%,rgba(228,181,71,0.18),transparent_60%)]" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
            Discover
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight xl:text-5xl">
            Swipe through verified listings on mobile.
          </h1>
          <p className="mt-4 max-w-lg text-base text-white/70">
            Discover is Yike&apos;s signature mobile discovery engine — save,
            skip, and open listings with polished gestures. On desktop, browse
            the feed below or jump into Search.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="pressable inline-flex min-h-[48px] items-center rounded-2xl bg-gold px-6 text-sm font-bold text-navy"
            >
              Search properties
            </Link>
            <Link
              href="/vehicles"
              className="pressable inline-flex min-h-[48px] items-center rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white"
            >
              Browse vehicles
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-navy">Fresh picks</h2>
          <Link
            href="/search"
            className="text-sm font-bold text-gold-dark hover:underline"
          >
            View all
          </Link>
        </div>
        {items.length > 0 ? (
          <PropertyGrid properties={items.slice(0, 9)} />
        ) : (
          <p className="rounded-2xl border border-navy/10 bg-white p-8 text-sm text-muted">
            No listings to preview yet. Try Search to explore Nigeria.
          </p>
        )}
        {items[0] ? (
          <p className="mt-6 text-center text-sm text-muted">
            Starting from{" "}
            <span className="font-semibold text-navy">
              {formatPrice(
                Number(items[0].price),
                items[0].payment_period,
                items[0].listing_type,
              )}
            </span>
            {" · "}
            <Link
              href={listingPath(items[0])}
              className="font-semibold text-gold-dark hover:underline"
            >
              Open sample listing
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

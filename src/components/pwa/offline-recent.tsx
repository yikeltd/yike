"use client";

import Link from "next/link";
import Image from "next/image";
import { getRecentlyViewed } from "@/lib/recently-viewed";

export function OfflineRecentListings() {
  const items = getRecentlyViewed().slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section className="mt-8 w-full max-w-md text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">
        Recently viewed
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/properties/${item.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-2.5 shadow-sm"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">
                  {item.title}
                </p>
                <p className="truncate text-xs text-muted">
                  {item.area ? `${item.area}, ${item.city}` : item.city}
                </p>
                <p className="text-xs font-bold text-gold-dark">{item.priceLabel}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

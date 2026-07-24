"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";
import { cn } from "@/lib/utils";

/**
 * Compact recently-viewed rail for detail pages when no sponsored ad is active.
 * Returns null (no DOM) when there is nothing to show.
 */
export function DetailRecentlyViewed({
  excludeId,
  className,
}: {
  excludeId?: string;
  className?: string;
}) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const next = getRecentlyViewed()
      .filter((v) => v.id !== excludeId)
      .slice(0, 6);
    setItems(next);
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-2", className)} aria-label="Recently viewed">
      <h2 className="text-sm font-bold text-navy">Recently viewed</h2>
      <ul className="hide-scrollbar flex gap-2.5 overflow-x-auto pb-1">
        {items.map((item) => {
          const href =
            item.href ??
            (item.assetType === "VEHICLE"
              ? `/vehicles/${item.id}`
              : `/properties/${item.id}`);
          return (
            <li key={item.id} className="w-[7.5rem] shrink-0">
              <Link href={href} className="pressable block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-navy/5">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-navy">
                  {item.title}
                </p>
                {item.priceLabel ? (
                  <p className="text-[10px] font-semibold text-navy/70">{item.priceLabel}</p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import Link from "next/link";
import type { MarketplaceTrendLink } from "@/lib/home/marketplace-trending";
import { cn } from "@/lib/utils";

type Props = {
  items: readonly MarketplaceTrendLink[];
  className?: string;
};

/** Compact trending query chips — link to filtered search. */
export function HomeTrendingSearches({ items, className }: Props) {
  if (items.length === 0) return null;

  return (
    <section className={cn(className)}>
      <h2 className="mb-2 text-base font-bold tracking-tight text-navy sm:text-lg">
        Trending Searches
      </h2>
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            role="listitem"
            className="pressable shrink-0 rounded-lg bg-navy/[0.04] px-3 py-1.5 text-[11px] font-semibold text-navy/80 ring-1 ring-navy/8 transition-colors hover:bg-gold/15 hover:text-navy hover:ring-gold/30 sm:rounded-full sm:text-xs"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

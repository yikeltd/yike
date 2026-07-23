import Link from "next/link";
import type { FeaturedLocationLink } from "@/lib/home/marketplace-trending";
import { cn } from "@/lib/utils";

type Props = {
  items: readonly FeaturedLocationLink[];
  className?: string;
  title?: string;
};

/** Compact location row — category-scoped hubs. */
export function HomeFeaturedLocations({
  items,
  className,
  title = "Popular Locations",
}: Props) {
  if (items.length === 0) return null;

  return (
    <section className={cn(className)}>
      <h2 className="mb-2 text-base font-bold tracking-tight text-navy sm:text-lg">
        {title}
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
            className="pressable shrink-0 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-navy ring-1 ring-navy/10 transition-colors hover:ring-gold/40 sm:rounded-full sm:text-sm"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

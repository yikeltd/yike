"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { Property } from "@/types/database";
import { VehicleCard } from "@/components/marketplace/vehicle-card";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";

type Props = {
  items: Property[];
  kind?: "vehicle" | "property";
  priorityCount?: number;
};

export function CarouselRail({ items, kind = "vehicle", priorityCount = 2 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setActiveIndex(0);
      return;
    }
    const ratio = Math.max(0, Math.min(1, scrollLeft / maxScroll));
    const nextDot = Math.min(4, Math.floor(ratio * 5));
    setActiveIndex(nextDot);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* 3 COMPLETE CARDS VISIBLE PER ROW WITH SCROLL SNAPPING */}
      <div
        ref={containerRef}
        className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5"
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            className="w-[calc((100%-0.75rem)/3)] shrink-0 snap-start"
          >
            {kind === "vehicle" || item.asset_type === "VEHICLE" ? (
              <VehicleCard
                vehicle={item}
                variant="browse"
                priorityImage={i < priorityCount}
              />
            ) : (
              <PropertyCard
                property={item}
                variant="browse"
                priorityImage={i < priorityCount}
              />
            )}
          </div>
        ))}
      </div>

      {/* 5 CENTERED PAGINATION DOTS WITH GOLD ACTIVE DOT */}
      <div className="flex items-center justify-center gap-1.5 pt-1 pb-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((dotIndex) => (
          <span
            key={dotIndex}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIndex === dotIndex
                ? "w-4 bg-gold shadow-xs"
                : "w-1.5 bg-navy/20"
            )}
          />
        ))}
      </div>
    </div>
  );
}

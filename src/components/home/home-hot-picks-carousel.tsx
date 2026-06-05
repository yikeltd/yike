"use client";

import { useRef, useState } from "react";
import type { HotPickDisplay } from "@/lib/home-hot-picks";
import { HomeSpotlightCard } from "./home-spotlight-card";

export function HomeHotPicksCarousel({
  picks,
  title,
  subtitle,
}: {
  picks: HotPickDisplay[];
  title: string;
  subtitle?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  if (picks.length === 0) return null;

  const loopPicks = picks.length > 1 ? [...picks, ...picks] : picks;
  const useMarquee = picks.length > 2;

  return (
    <section className="full-bleed mt-6 overflow-hidden border-y border-gold/10 bg-gradient-to-r from-surface/40 via-transparent to-surface/40 py-5 lg:mt-8">
      <div className="mx-auto max-w-7xl px-3 lg:px-6 xl:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark dark:text-gold">
              {title}
            </p>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => window.setTimeout(() => setPaused(false), 2500)}
      >
        <div
          ref={trackRef}
          className={
            useMarquee && !paused
              ? "hot-picks-marquee flex w-max gap-3 px-3 lg:px-6"
              : "hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-3 lg:px-6"
          }
          style={useMarquee && !paused ? { width: "max-content" } : undefined}
        >
          {loopPicks.map((pick, i) => (
            <div key={`${pick.id}-${i}`} data-hot-pick className="shrink-0">
              <HomeSpotlightCard pick={pick} priority={i === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

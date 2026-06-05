"use client";

import { useEffect, useRef, useState } from "react";
import type { HotPickDisplay } from "@/lib/home-hot-picks";
import { cn } from "@/lib/utils";
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
  const indexRef = useRef(0);

  useEffect(() => {
    if (picks.length <= 1 || paused) return;

    const tick = () => {
      const track = trackRef.current;
      if (!track) return;
      const cards = track.querySelectorAll<HTMLElement>("[data-hot-pick]");
      if (cards.length === 0) return;
      indexRef.current = (indexRef.current + 1) % cards.length;
      const target = cards[indexRef.current];
      track.scrollTo({
        left: target.offsetLeft - track.offsetLeft,
        behavior: "smooth",
      });
    };

    const start = window.setTimeout(tick, 1500);
    const id = window.setInterval(tick, 4500);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [picks.length, paused]);

  if (picks.length === 0) return null;

  const loopPicks = picks.length > 1 ? [...picks, ...picks] : picks;

  return (
    <section className="mt-8 px-3 lg:mt-10 lg:px-6 xl:px-8">
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-dark">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        )}
      </div>

      <div
        ref={trackRef}
        className="hide-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-3 pb-1 lg:mx-0 lg:px-0"
        dir="ltr"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => window.setTimeout(() => setPaused(false), 2000)}
      >
        {loopPicks.map((pick, i) => (
          <div key={`${pick.id}-${i}`} data-hot-pick className="snap-start">
            <HomeSpotlightCard pick={pick} priority={i === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}

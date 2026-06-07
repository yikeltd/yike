"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildPriceExplanation } from "@/constants/valueDrivers";

export function ListingValueDriversDisplay({
  drivers,
  className,
}: {
  drivers: { key: string; label: string }[];
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (drivers.length === 0) return null;

  const visible = expanded ? drivers : drivers.slice(0, 6);
  const priceExplanation = buildPriceExplanation(drivers.map((d) => d.label));

  return (
    <section
      className={cn(
        "rounded-2xl border border-navy/5 bg-white p-4 shadow-sm lg:p-5",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-navy lg:text-base">
            Why this property stands out
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            Features selected by the agent and reviewed where necessary.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {visible.map((d) => (
          <span
            key={d.key}
            className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-foreground"
          >
            {d.label}
          </span>
        ))}
      </div>

      {drivers.length > 6 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-semibold text-gold-dark"
        >
          {expanded ? "Show less" : `Show ${drivers.length - 6} more`}
        </button>
      )}

      {priceExplanation && (
        <div className="mt-4 rounded-xl bg-surface/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
            Why this price may make sense
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted lg:text-sm">
            {priceExplanation}
          </p>
        </div>
      )}
    </section>
  );
}

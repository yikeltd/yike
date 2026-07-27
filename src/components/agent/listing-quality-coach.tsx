"use client";

import { cn } from "@/lib/utils";
import type { ListingQualityCoachResult } from "@/lib/listing-quality";

export function ListingQualityCoach({
  coach,
  className,
}: {
  coach: ListingQualityCoachResult;
  className?: string;
}) {
  const good = coach.tips.filter((t) => t.kind === "good");
  const missing = coach.tips.filter((t) => t.kind === "missing");

  return (
    <aside
      className={cn(
        "rounded-2xl border border-navy/[0.08] bg-white p-4 shadow-[0_6px_20px_-12px_rgba(3,27,78,0.14)]",
        className,
      )}
      aria-label="Listing quality"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/45">
            Listing quality
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-navy">
            {coach.score}
            <span className="text-base font-semibold text-navy/40">%</span>
          </p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-navy/[0.06]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              coach.score >= 90
                ? "bg-emerald-500"
                : coach.score >= 70
                  ? "bg-gold"
                  : "bg-navy/40",
            )}
            style={{ width: `${Math.max(4, Math.min(100, coach.score))}%` }}
          />
        </div>
      </div>

      {good.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {good.map((tip) => (
            <li key={tip.id} className="flex gap-2 text-sm text-navy/75">
              <span className="text-emerald-600" aria-hidden>
                ✓
              </span>
              <span>{tip.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {missing.length > 0 ? (
        <div className="mt-3 border-t border-navy/[0.06] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/45">
            Missing
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {missing.map((tip) => (
              <li key={tip.id} className="flex gap-2 text-sm text-navy/80">
                <span className="text-navy/30" aria-hidden>
                  •
                </span>
                <span>
                  {tip.label}
                  {tip.estimatedLift ? (
                    <span className="ml-1 text-xs font-medium text-gold-dark">
                      +{tip.estimatedLift}%
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          {coach.estimatedImprovement > 0 ? (
            <p className="mt-2 text-xs font-medium text-navy/55">
              Estimated improvement: +{coach.estimatedImprovement}%
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-emerald-700">Looking strong — ready to publish.</p>
      )}
    </aside>
  );
}

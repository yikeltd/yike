"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, Search, ShieldCheck, type LucideIcon } from "lucide-react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { getRecentSearches } from "@/lib/search-recent";
import { cn } from "@/lib/utils";

function useCountUp(target: number, durationMs = 650) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }

    setValue(0);
    let frame = 0;
    let cancelled = false;
    const start = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [target, durationMs]);

  return value;
}

type StatTone = "gold" | "blue" | "emerald" | "violet";

const toneStyles: Record<
  StatTone,
  { card: string; icon: string; iconFg: string }
> = {
  gold: {
    card: "border-gold/15 bg-gold/[0.05] hover:border-gold/30",
    icon: "bg-gold/15",
    iconFg: "text-gold-dark",
  },
  blue: {
    card: "border-sky-500/12 bg-sky-500/[0.05] hover:border-sky-500/25",
    icon: "bg-sky-500/12",
    iconFg: "text-sky-700",
  },
  emerald: {
    card: "border-emerald-500/12 bg-emerald-500/[0.05] hover:border-emerald-500/25",
    icon: "bg-emerald-500/12",
    iconFg: "text-emerald-700",
  },
  violet: {
    card: "border-violet-500/12 bg-violet-500/[0.05] hover:border-violet-500/25",
    icon: "bg-violet-500/12",
    iconFg: "text-violet-700",
  },
};

function StatCard({
  icon: Icon,
  label,
  fullLabel,
  value,
  href,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  fullLabel: string;
  value: number;
  href: string;
  tone: StatTone;
}) {
  const animated = useCountUp(value);
  const styles = toneStyles[tone];

  return (
    <Link
      href={href}
      title={fullLabel}
      aria-label={`${animated} ${fullLabel}`}
      data-tone={tone}
      className={cn(
        "dashboard-stat-card dashboard-live-card pressable group flex min-w-0 flex-col gap-1.5 rounded-xl border p-2 shadow-sm sm:gap-2 sm:p-3",
        styles.card
      )}
    >
      <span
        className={cn(
          "dashboard-live-card__icon flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-8 sm:w-8",
          styles.icon,
          styles.iconFg
        )}
      >
        <Icon className="h-3 w-3 transition-transform duration-200 group-hover:scale-110 sm:h-3.5 sm:w-3.5" strokeWidth={2.25} aria-hidden />
      </span>

      <div className="min-w-0">
        <p className="dashboard-live-card__value text-lg font-bold leading-none tabular-nums tracking-tight text-navy sm:text-2xl">
          {animated}
        </p>
        <p className="mt-0.5 truncate text-[9px] font-medium leading-tight text-muted transition-colors duration-200 group-hover:text-navy/70 sm:mt-1 sm:text-[11px]">
          {label}
        </p>
      </div>
    </Link>
  );
}

export function ProfileUserActivityStats({
  savedCount,
  verificationRequestsCount,
}: {
  savedCount: number;
  verificationRequestsCount: number;
}) {
  const [viewedCount, setViewedCount] = useState(0);
  const [searchCount, setSearchCount] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setViewedCount(getRecentlyViewed().length);
      setSearchCount(getRecentSearches().length);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
      <StatCard
        icon={Heart}
        label="Saved"
        fullLabel="Saved homes"
        value={savedCount}
        href="/saved"
        tone="gold"
      />
      <StatCard
        icon={Eye}
        label="Viewed"
        fullLabel="Viewed homes"
        value={viewedCount}
        href="/search"
        tone="blue"
      />
      <StatCard
        icon={Search}
        label="Searches"
        fullLabel="Recent searches"
        value={searchCount}
        href="/search"
        tone="emerald"
      />
      <StatCard
        icon={ShieldCheck}
        label="Verify"
        fullLabel="Verification requests"
        value={verificationRequestsCount}
        href="/property-verification/requests"
        tone="violet"
      />
    </section>
  );
}

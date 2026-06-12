"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, Search, ShieldCheck } from "lucide-react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { getRecentSearches } from "@/lib/search-recent";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="yike-card yike-card-compact yike-card-interactive pressable flex flex-col"
    >
      <Icon className="h-3.5 w-3.5 text-gold-dark" />
      <p className="mt-1.5 text-lg font-bold leading-none tabular-nums text-navy">{value}</p>
      <p className="mt-0.5 text-[10px] leading-tight text-muted">{label}</p>
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
    <section className={cn("grid grid-cols-2 gap-1.5")}>
      <StatCard icon={Heart} label="Saved homes" value={String(savedCount)} href="/saved" />
      <StatCard icon={Eye} label="Viewed homes" value={String(viewedCount)} href="/search" />
      <StatCard icon={Search} label="Recent searches" value={String(searchCount)} href="/search" />
      <StatCard
        icon={ShieldCheck}
        label="Verification requests"
        value={String(verificationRequestsCount)}
        href="/property-verification/requests"
      />
    </section>
  );
}

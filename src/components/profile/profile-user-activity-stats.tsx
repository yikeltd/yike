"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Heart, Search, ShieldCheck } from "lucide-react";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { getRecentSearches } from "@/lib/search-recent";

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
      className="pressable rounded-2xl border border-border bg-elevated p-4 shadow-float"
    >
      <Icon className="h-4 w-4 text-gold-dark" />
      <p className="mt-3 text-xl font-bold text-navy">{value}</p>
      <p className="text-xs text-muted">{label}</p>
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
    setViewedCount(getRecentlyViewed().length);
    setSearchCount(getRecentSearches().length);
  }, []);

  return (
    <section className="grid grid-cols-2 gap-3">
      <StatCard icon={Heart} label="Saved homes" value={String(savedCount)} href="/saved" />
      <StatCard icon={Eye} label="Viewed homes" value={String(viewedCount)} href="/search" />
      <StatCard icon={Search} label="Recent searches" value={String(searchCount)} href="/search" />
      <StatCard
        icon={ShieldCheck}
        label="Verification requests"
        value={String(verificationRequestsCount)}
        href="/property-verification"
      />
    </section>
  );
}

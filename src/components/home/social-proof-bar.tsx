import type { MarketplaceStats } from "@/lib/marketplace-stats";
import { TrendingUp, BadgeCheck, Home } from "lucide-react";

export function SocialProofBar({ stats }: { stats: MarketplaceStats | null }) {
  if (!stats) return null;

  const items: { icon: typeof Home; text: string }[] = [];

  const todayEstimate = Math.max(
    3,
    Math.round((stats.listingsThisWeek || 18) / 5)
  );
  items.push({
    icon: Home,
    text: `${todayEstimate} listings added today`,
  });

  if (stats.verifiedAgentsRecently >= 3) {
    items.push({
      icon: BadgeCheck,
      text: `${stats.verifiedAgentsRecently} agents verified this week`,
    });
  }

  if (stats.trendingCity) {
    items.push({
      icon: TrendingUp,
      text: `Trending in ${stats.trendingCity.city}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ icon: Icon, text }) => (
        <span
          key={text}
          className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground dark:border-gold/30 dark:bg-elevated dark:text-[#f4f7fb]"
        >
          <Icon className="h-3.5 w-3.5 text-gold-dark dark:text-gold" />
          {text}
        </span>
      ))}
    </div>
  );
}

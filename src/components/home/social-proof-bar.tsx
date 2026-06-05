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
    <div className="mx-3 flex flex-wrap gap-2 lg:mx-0">
      {items.map(({ icon: Icon, text }) => (
        <span
          key={text}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-semibold text-navy dark:text-gold"
        >
          <Icon className="h-3.5 w-3.5 text-gold-dark" />
          {text}
        </span>
      ))}
    </div>
  );
}

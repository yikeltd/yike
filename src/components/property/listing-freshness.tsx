import { cn } from "@/lib/utils";
import { isRecentlyUpdated } from "@/lib/trust/quality";

export function getListingFreshness(
  updatedAt: string,
  options?: {
    createdAt?: string;
    lastRefreshedAt?: string | null;
    viewsCount?: number;
    verified?: boolean;
    contactClicks?: number;
  }
): {
  label: string;
  tone: "new" | "active" | "trending" | "verified" | "hot" | "quiet";
  showPublicly: boolean;
} {
  const {
    createdAt,
    lastRefreshedAt,
    viewsCount,
    verified,
    contactClicks,
  } = options ?? {};

  const refreshedAt = lastRefreshedAt ?? updatedAt;
  const createdRef = createdAt ?? updatedAt;
  const createdMs = Date.now() - new Date(createdRef).getTime();
  const createdDays = Math.floor(createdMs / 86_400_000);
  const refreshedMs = Date.now() - new Date(refreshedAt).getTime();
  const refreshedDays = Math.floor(refreshedMs / 86_400_000);

  if (isRecentlyUpdated({ updated_at: updatedAt, last_refreshed_at: lastRefreshedAt })) {
    return { label: "Updated recently", tone: "active", showPublicly: true };
  }

  if (createdDays < 1) return { label: "Posted today", tone: "new", showPublicly: true };
  if (refreshedDays < 1 && createdDays >= 1) {
    return { label: "Updated today", tone: "active", showPublicly: true };
  }

  const hotScore = (contactClicks ?? 0) >= 3 || (viewsCount ?? 0) >= 20;
  if (createdDays <= 7 && hotScore) {
    return { label: "Popular this week", tone: "hot", showPublicly: true };
  }

  if (viewsCount && viewsCount >= 40) {
    return { label: "Trending now", tone: "trending", showPublicly: true };
  }

  if (verified && refreshedDays <= 7) {
    return { label: "Verified recently", tone: "verified", showPublicly: true };
  }

  if (createdDays === 1) return { label: "Posted yesterday", tone: "new", showPublicly: true };
  if (createdDays <= 7) return { label: "New this week", tone: "new", showPublicly: true };

  return { label: "", tone: "quiet", showPublicly: false };
}

export function ListingFreshness({
  updatedAt,
  createdAt,
  lastRefreshedAt,
  viewsCount,
  verified,
  contactClicks,
  className,
  dark,
}: {
  updatedAt: string;
  createdAt?: string;
  lastRefreshedAt?: string | null;
  viewsCount?: number;
  verified?: boolean;
  contactClicks?: number;
  className?: string;
  dark?: boolean;
}) {
  const { label, tone, showPublicly } = getListingFreshness(updatedAt, {
    createdAt,
    lastRefreshedAt,
    viewsCount,
    verified,
    contactClicks,
  });

  if (!showPublicly || !label) return null;

  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide",
        (tone === "new" ||
          tone === "trending" ||
          tone === "verified" ||
          tone === "hot") &&
          (dark ? "text-gold" : "text-gold-dark"),
        tone === "active" && (dark ? "text-white/80" : "text-muted"),
        className
      )}
    >
      {label}
    </span>
  );
}

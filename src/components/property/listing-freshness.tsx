import { cn } from "@/lib/utils";

export function getListingFreshness(
  updatedAt: string,
  createdAt?: string,
  viewsCount?: number,
  verified?: boolean,
  contactClicks?: number
): {
  label: string;
  tone: "new" | "active" | "trending" | "verified" | "hot" | "stale";
} {
  const ref = createdAt ?? updatedAt;
  const ms = Date.now() - new Date(ref).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);

  const updatedMs = Date.now() - new Date(updatedAt).getTime();
  const updatedHours = Math.floor(updatedMs / 3_600_000);
  const updatedDays = Math.floor(updatedMs / 86_400_000);

  if (hours < 24) return { label: "Posted today", tone: "new" };
  if (updatedHours < 24 && days >= 1) {
    return { label: "Updated today", tone: "active" };
  }
  if (verified && updatedDays <= 7) {
    return { label: "Verified recently", tone: "verified" };
  }

  const hotScore = (contactClicks ?? 0) >= 3 || (viewsCount ?? 0) >= 20;
  if (days <= 7 && hotScore) {
    return { label: "Hot this week", tone: "hot" };
  }

  if (viewsCount && viewsCount >= 40) {
    return { label: "Trending now", tone: "trending" };
  }
  if (days === 1) return { label: "Posted yesterday", tone: "new" };
  if (days <= 7) return { label: "New this week", tone: "new" };

  if (updatedDays === 1) return { label: "Updated yesterday", tone: "active" };
  if (updatedDays <= 14) {
    return { label: `Updated ${updatedDays} days ago`, tone: "active" };
  }

  const d = new Date(updatedAt);
  const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  return { label: `Updated ${label}`, tone: "stale" };
}

export function ListingFreshness({
  updatedAt,
  createdAt,
  viewsCount,
  verified,
  contactClicks,
  className,
  dark,
}: {
  updatedAt: string;
  createdAt?: string;
  viewsCount?: number;
  verified?: boolean;
  contactClicks?: number;
  className?: string;
  dark?: boolean;
}) {
  const { label, tone } = getListingFreshness(
    updatedAt,
    createdAt,
    viewsCount,
    verified,
    contactClicks
  );
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
        tone === "stale" && (dark ? "text-white/60" : "text-muted"),
        className
      )}
    >
      {label}
    </span>
  );
}

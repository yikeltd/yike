import { cn } from "@/lib/utils";

export function getListingFreshness(
  updatedAt: string,
  createdAt?: string,
  viewsCount?: number,
  verified?: boolean
): {
  label: string;
  tone: "new" | "active" | "stale" | "trending" | "verified";
} {
  const ref = createdAt ?? updatedAt;
  const ms = Date.now() - new Date(ref).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);

  const updatedMs = Date.now() - new Date(updatedAt).getTime();
  const updatedDays = Math.floor(updatedMs / 86_400_000);

  if (verified && updatedDays <= 30) {
    return { label: "Verified recently", tone: "verified" };
  }

  if (viewsCount && viewsCount >= 40) {
    return { label: "Trending now", tone: "trending" };
  }
  if (hours < 24) return { label: "Listed today", tone: "new" };
  if (days === 1) return { label: "Listed yesterday", tone: "new" };
  if (days <= 7) return { label: `Listed ${days} days ago`, tone: "new" };

  if (updatedDays === 0) return { label: "Updated today", tone: "active" };
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
  className,
  dark,
}: {
  updatedAt: string;
  createdAt?: string;
  viewsCount?: number;
  verified?: boolean;
  className?: string;
  dark?: boolean;
}) {
  const { label, tone } = getListingFreshness(
    updatedAt,
    createdAt,
    viewsCount,
    verified
  );
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide",
        (tone === "new" || tone === "trending" || tone === "verified") &&
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

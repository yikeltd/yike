import { cn } from "@/lib/utils";

export function getListingFreshness(
  updatedAt: string,
  createdAt?: string,
  viewsCount?: number
): {
  label: string;
  tone: "new" | "active" | "stale" | "trending";
} {
  const ref = createdAt ?? updatedAt;
  const ms = Date.now() - new Date(ref).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);

  if (viewsCount && viewsCount >= 40) {
    return { label: "Trending now", tone: "trending" };
  }
  if (hours < 2) return { label: "Just added", tone: "new" };
  if (hours < 24) return { label: "Listed today", tone: "new" };
  if (days <= 2) return { label: "Just listed", tone: "new" };
  if (days <= 7) return { label: "New", tone: "new" };
  if (days <= 14) return { label: "Active", tone: "active" };

  const updatedMs = Date.now() - new Date(updatedAt).getTime();
  const updatedHours = Math.floor(updatedMs / 3_600_000);
  if (updatedHours < 24 && days > 2) {
    return {
      label: updatedHours < 2 ? "Updated recently" : `Updated ${updatedHours}h ago`,
      tone: "active",
    };
  }

  const d = new Date(updatedAt);
  const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  return { label: `Updated ${label}`, tone: "stale" };
}

export function ListingFreshness({
  updatedAt,
  createdAt,
  viewsCount,
  className,
  dark,
}: {
  updatedAt: string;
  createdAt?: string;
  viewsCount?: number;
  className?: string;
  dark?: boolean;
}) {
  const { label, tone } = getListingFreshness(updatedAt, createdAt, viewsCount);
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide",
        (tone === "new" || tone === "trending") &&
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

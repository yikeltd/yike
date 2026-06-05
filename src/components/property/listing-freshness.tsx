import { cn } from "@/lib/utils";

export function getListingFreshness(updatedAt: string): {
  label: string;
  tone: "new" | "active" | "stale";
} {
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / 86_400_000
  );
  if (days <= 2) return { label: "Just listed", tone: "new" };
  if (days <= 7) return { label: "New", tone: "new" };
  if (days <= 14) return { label: "Active", tone: "active" };
  const d = new Date(updatedAt);
  const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  return { label: `Updated ${label}`, tone: "stale" };
}

export function ListingFreshness({
  updatedAt,
  className,
  dark,
}: {
  updatedAt: string;
  className?: string;
  dark?: boolean;
}) {
  const { label, tone } = getListingFreshness(updatedAt);
  return (
    <span
      className={cn(
        "text-[10px] font-bold uppercase tracking-wide",
        tone === "new" && (dark ? "text-gold" : "text-gold-dark"),
        tone === "active" && (dark ? "text-white/80" : "text-muted"),
        tone === "stale" && (dark ? "text-white/60" : "text-muted"),
        className
      )}
    >
      {label}
    </span>
  );
}

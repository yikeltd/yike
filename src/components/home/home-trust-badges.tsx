import { cn } from "@/lib/utils";

const BADGES = [
  "Verified Listings",
  "Verified Sellers",
  "Secure Marketplace",
] as const;

/** Ultra-compact trust strip — labels only, no descriptions. */
export function HomeTrustBadges({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:gap-x-6",
        className,
      )}
      aria-label="Trust signals"
    >
      {BADGES.map((label) => (
        <li
          key={label}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-navy/45 sm:text-[11px]"
        >
          <span className="text-gold-dark/90" aria-hidden>
            ✓
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

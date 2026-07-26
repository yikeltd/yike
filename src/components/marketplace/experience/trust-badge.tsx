import { BadgeCheck, Fingerprint, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustBadgeKind =
  | "verified_dealer"
  | "verified_seller"
  | "media_protected"
  | "trusted_seller"
  | "verified_listing";

const BADGE_META: Record<
  TrustBadgeKind,
  { label: string; icon: LucideIcon; className: string }
> = {
  verified_dealer: {
    label: "Verified Dealer",
    icon: BadgeCheck,
    className: "bg-gold/20 text-navy ring-gold/40",
  },
  verified_seller: {
    label: "Verified Seller",
    icon: BadgeCheck,
    className: "bg-gold/20 text-navy ring-gold/40",
  },
  verified_listing: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-emerald-600/95 text-white ring-emerald-700/30",
  },
  media_protected: {
    label: "Media Protected",
    icon: Fingerprint,
    className: "bg-navy/[0.07] text-navy ring-navy/15",
  },
  trusted_seller: {
    label: "Trusted Seller",
    icon: ShieldCheck,
    className: "bg-navy/[0.07] text-navy ring-navy/15",
  },
};

/** Visual trust language only — does not change verification logic. */
export function TrustBadge({
  kind,
  size = "md",
  className,
}: {
  kind: TrustBadgeKind;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = BADGE_META[kind];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-bold ring-1",
        size === "sm"
          ? "px-1.5 py-0.5 text-[9px]"
          : "px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]",
        meta.className,
        className,
      )}
    >
      <Icon
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

export function TrustBadgeRow({
  kinds,
  className,
}: {
  kinds: TrustBadgeKind[];
  className?: string;
}) {
  if (kinds.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {kinds.map((kind) => (
        <TrustBadge key={kind} kind={kind} size="sm" />
      ))}
    </div>
  );
}

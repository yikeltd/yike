"use client";

import { cn } from "@/lib/utils";
import {
  deriveSellerBuyerBadge,
  SELLER_BUYER_BADGE_LABELS,
  type SellerBuyerBadge,
  type SellerTrustProfileSlice,
} from "@/lib/seller-trust";
import { AlertTriangle, BadgeCheck, Clock3 } from "lucide-react";

const STYLES: Record<
  SellerBuyerBadge,
  { className: string; icon: typeof BadgeCheck; prefix: string }
> = {
  verified_seller: {
    className: "border-gold/25 bg-gold text-navy shadow-glow-gold",
    icon: BadgeCheck,
    prefix: "✓",
  },
  verification_pending: {
    className: "border-amber-200 bg-amber-50 text-amber-900",
    icon: Clock3,
    prefix: "⏳",
  },
  unverified_seller: {
    className: "border-border bg-elevated text-muted",
    icon: AlertTriangle,
    prefix: "⚠",
  },
};

export function SellerTrustBadge({
  profile,
  badge,
  size = "md",
  className,
}: {
  profile?: Partial<SellerTrustProfileSlice> | null;
  badge?: SellerBuyerBadge;
  size?: "sm" | "md";
  className?: string;
}) {
  const resolved = badge ?? deriveSellerBuyerBadge(profile);
  const style = STYLES[resolved];
  const Icon = style.icon;
  const label = SELLER_BUYER_BADGE_LABELS[resolved];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-bold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        style.className,
        className
      )}
      aria-label={label}
      title={label}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.5} />
      <span className="sr-only">{style.prefix} </span>
      {label}
    </span>
  );
}

import Link from "next/link";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Marketplace safety — product UX only (not Trust Runtime).
 * Prefer the compact link on search + detail surfaces.
 */

/** Inline link for search / detail pages — does not compete with primary CTAs. */
export function MarketplaceSafetyTipsLink({
  className,
}: {
  className?: string;
}) {
  return (
    <Link
      href="/safety"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold text-navy/50 transition-colors hover:text-navy",
        className
      )}
    >
      <Shield className="h-3.5 w-3.5 text-gold" aria-hidden />
      Safety Tips →
    </Link>
  );
}

/**
 * Compact Stay Safe control for listing detail.
 * Full tip list lives on /safety — keeps detail pages free of tall safety cards.
 */
export function MarketplaceSafetyNotice({
  vertical = "property",
  className,
}: {
  vertical?: "property" | "vehicle" | "seller" | "dealer";
  className?: string;
}) {
  void vertical;

  return <MarketplaceSafetyTipsLink className={className} />;
}

/** @deprecated Prefer MarketplaceSafetyNotice — kept for import compatibility. */
export const MARKETPLACE_TRUST = {
  listingReview:
    "Every new listing is reviewed before it goes live. Clear photos and accurate details help approval.",
  whatsappContact:
    "Chat on WhatsApp to confirm availability. Never pay inspection or booking fees to strangers without verifying the seller.",
  reportListing:
    "See something wrong? Report it — our team reviews marketplace reports.",
  freshness:
    "Prefer recently updated listings. Ask when the item was last available.",
  dealer:
    "Dealers may show a Dealer badge. Always verify paperwork for vehicles before payment.",
  passportFuture:
    "Passport verification from Stankings will strengthen seller trust across the ecosystem when activated — Yike will consume it, not replace it.",
} as const;

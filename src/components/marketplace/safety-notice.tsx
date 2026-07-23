import Link from "next/link";

/**
 * Compact marketplace safety card — product UX only (not Trust Runtime).
 * Minimal vertical space; full tips on /safety.
 */

const TIPS = [
  "Meet in safe public places",
  "Verify before payment",
  "Report suspicious listings",
] as const;

export function MarketplaceSafetyNotice({
  vertical = "property",
}: {
  vertical?: "property" | "vehicle" | "seller" | "dealer";
}) {
  void vertical;

  return (
    <aside className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-navy/8 bg-navy/[0.03] px-3.5 py-2.5 text-sm text-navy/75">
      <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-navy">
        Stay safe
      </p>
      <ul className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1 text-xs text-navy/65 sm:text-sm">
        {TIPS.map((tip) => (
          <li key={tip} className="flex items-center gap-1.5">
            <span className="h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden />
            {tip}
          </li>
        ))}
      </ul>
      <Link
        href="/safety"
        className="shrink-0 text-xs font-bold text-gold-dark hover:underline sm:text-sm"
      >
        Learn More
      </Link>
    </aside>
  );
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

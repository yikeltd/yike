/**
 * Marketplace trust copy — product UX only (not constitutional Trust Runtime).
 */

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

export function MarketplaceSafetyNotice({
  vertical = "property",
}: {
  vertical?: "property" | "vehicle" | "seller" | "dealer";
}) {
  return (
    <aside className="rounded-xl border border-navy/10 bg-navy/[0.03] px-4 py-3 text-sm text-navy/80">
      <p className="font-semibold text-navy">Stay safe on Yike</p>
      <p className="mt-1">{MARKETPLACE_TRUST.whatsappContact}</p>
      {vertical === "vehicle" || vertical === "dealer" ? (
        <p className="mt-1">{MARKETPLACE_TRUST.dealer}</p>
      ) : null}
      {vertical === "seller" || vertical === "dealer" ? (
        <p className="mt-1 text-xs text-navy/55">{MARKETPLACE_TRUST.passportFuture}</p>
      ) : null}
      <p className="mt-1 text-xs text-navy/55">{MARKETPLACE_TRUST.reportListing}</p>
    </aside>
  );
}

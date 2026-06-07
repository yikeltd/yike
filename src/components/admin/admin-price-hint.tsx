import type { Property } from "@/types/database";
import { formatPrice } from "@/lib/utils";

export function AdminPriceHint({ listing }: { listing: Property }) {
  const level = listing.price_anomaly_level;
  if (!level || level === "normal" || level === "insufficient_data" || level === "luxury_exception") {
    return null;
  }

  const snap = listing.market_price_snapshot as {
    p25_price?: number;
    p75_price?: number;
    median_price?: number;
    sample_count?: number;
  } | null;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Pricing hint (admin only)</p>
      {listing.price_anomaly_reason ? (
        <p className="mt-1">{listing.price_anomaly_reason}</p>
      ) : (
        <p className="mt-1">Price pattern flagged as {level.replace(/_/g, " ")}.</p>
      )}
      {snap?.sample_count ? (
        <p className="mt-2 text-xs text-amber-900/80">
          Market sample: {snap.sample_count} listings
          {snap.median_price ? ` · median ${formatPrice(Number(snap.median_price))}` : ""}
          {snap.p25_price && snap.p75_price
            ? ` · typical ${formatPrice(Number(snap.p25_price))}–${formatPrice(Number(snap.p75_price))}`
            : ""}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-amber-900/70">
        Review status: {listing.price_review_status ?? "none"}
        {listing.price_confidence_score != null
          ? ` · confidence ${Math.round(Number(listing.price_confidence_score))}`
          : ""}
      </p>
    </div>
  );
}

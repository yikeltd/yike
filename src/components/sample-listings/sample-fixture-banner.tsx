import { isSampleListingFixtureEnabled } from "@/lib/sample-listings/flags";

/** Dev-only banner when sample fixture catalog is active on a route. */
export function SampleFixtureBanner({ active = true }: { active?: boolean }) {
  if (!isSampleListingFixtureEnabled() || !active) return null;
  return (
    <div
      className="border-b border-gold/30 bg-gold/10 px-3 py-2 text-center text-xs font-semibold text-navy lg:text-sm"
      role="status"
    >
      Sample listings (dev fixture) — not live inventory. Enable only via{" "}
      <code className="rounded bg-white/80 px-1">YIKE_SAMPLE_LISTINGS_FIXTURE=1</code> in
      development.
    </div>
  );
}

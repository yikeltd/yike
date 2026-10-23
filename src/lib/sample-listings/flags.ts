/**
 * Dev-only fixture flag — never auto-enabled when Supabase is empty.
 * Set YIKE_SAMPLE_LISTINGS_FIXTURE=1 in .env.local for offline UI work.
 */
export function isSampleListingFixtureEnabled(): boolean {
  if (process.env.YIKE_SAMPLE_LISTINGS_FIXTURE !== "1") return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

/** Dev-only: use the 30-item catalog even when production DB returns live rows. */
export function isSampleListingFixtureForceEnabled(): boolean {
  return (
    isSampleListingFixtureEnabled() &&
    process.env.YIKE_SAMPLE_LISTINGS_FIXTURE_FORCE === "1"
  );
}

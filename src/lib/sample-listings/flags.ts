/**
 * Local/test sample catalog — never enabled on production.
 * Default ON in development and test; opt out with YIKE_SAMPLE_LISTINGS_FIXTURE=0.
 * Explicit opt-in still works with YIKE_SAMPLE_LISTINGS_FIXTURE=1.
 */

function isProductionRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

export function isSampleListingFixtureEnabled(): boolean {
  if (isProductionRuntime()) return false;
  if (process.env.YIKE_SAMPLE_LISTINGS_FIXTURE === "0") return false;
  if (process.env.YIKE_SAMPLE_LISTINGS_FIXTURE === "1") return true;
  // Default on for local dev + Playwright (NODE_ENV development | test)
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  );
}

/** Dev-only: use the 30-item catalog even when production DB returns live rows. */
export function isSampleListingFixtureForceEnabled(): boolean {
  return (
    isSampleListingFixtureEnabled() &&
    process.env.YIKE_SAMPLE_LISTINGS_FIXTURE_FORCE === "1"
  );
}

/** True when detail page is serving a handcrafted sample row (slug or id prefix). */
export function isSampleListingRecord(
  listing: { id?: string; slug?: string | null; attributes?: unknown },
): boolean {
  const attrs = listing.attributes as Record<string, unknown> | null | undefined;
  if (attrs?.is_sample === true || attrs?.seed_namespace) return true;
  const id = listing.id ?? "";
  const slug = listing.slug ?? "";
  return id.startsWith("s3000001-") || slug.startsWith("sample-");
}

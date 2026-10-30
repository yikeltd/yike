/** Detect cross-vertical “All categories” search on `/search`. */
export function isMixedMarketplaceSearch(
  raw: Record<string, string | string[] | undefined>,
): boolean {
  const v = raw.marketplace;
  const single = Array.isArray(v) ? v[0] : v;
  return single === "all";
}

import { fromSlug, resolveAreaSlug, resolveCitySlug } from "@/lib/location-slugs";

const HUB_QUERY: Record<string, string> = {
  buy: "type=buy",
  shops: "property_type=shop",
  land: "hub=land_sale",
};

/**
 * SEO-friendly hub URLs → programmatic /houses/* pages.
 * /rent/aba → /houses/aba
 * /buy/enugu → /houses/enugu?type=buy
 * Unknown city slugs → /search with city hint
 */
export function seoHubRedirect(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const hub = parts[0]!;
  if (!["rent", "buy", "shops", "land"].includes(hub)) return null;

  const query = HUB_QUERY[hub];
  const appendQuery = (path: string) =>
    query ? `${path}?${query}` : path;

  if (parts.length === 2) {
    const citySlug = parts[1]!;
    if (resolveCitySlug(citySlug)) {
      return appendQuery(`/houses/${citySlug}`);
    }
    return `/search?city=${encodeURIComponent(fromSlug(citySlug))}`;
  }

  if (parts.length === 3) {
    const [citySlug, areaSlug] = parts.slice(1);
    if (citySlug && areaSlug && resolveAreaSlug(citySlug, areaSlug)) {
      return appendQuery(`/houses/${citySlug}/${areaSlug}`);
    }
    if (citySlug && resolveCitySlug(citySlug)) {
      return appendQuery(`/houses/${citySlug}`);
    }
    if (citySlug) {
      const params = new URLSearchParams({
        city: fromSlug(citySlug),
      });
      if (areaSlug) params.set("area", fromSlug(areaSlug));
      return `/search?${params.toString()}`;
    }
  }

  return `/search`;
}

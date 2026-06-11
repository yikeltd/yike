import { fromSlug, resolveAreaSlug, resolveCitySlug } from "@/lib/location-slugs";
import { intentInCityPath, type SeoListingIntent } from "@/lib/seo/intent-in-city";

/**
 * Legacy hub URLs → canonical /rent-in-{city} pages.
 * /rent/aba → /rent-in-aba
 * /buy/enugu → /buy-in-enugu
 * /land/owerri → /land-in-owerri
 */
export function seoHubRedirect(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const hub = parts[0]!;
  const intentHubs: Record<string, SeoListingIntent | null> = {
    rent: "rent",
    buy: "buy",
    land: "land",
    shops: null,
  };
  if (!(hub in intentHubs)) return null;

  const intent = intentHubs[hub];
  if (intent && parts.length === 2) {
    const citySlug = parts[1]!;
    if (resolveCitySlug(citySlug)) {
      return intentInCityPath(intent, citySlug);
    }
    const params = new URLSearchParams({ city: fromSlug(citySlug) });
    if (intent === "buy") {
      params.set("type", "sale");
      params.set("hub", "buy");
    } else if (intent === "land") {
      params.set("hub", "land_sale");
    } else {
      params.set("type", "rent");
    }
    return `/search?${params.toString()}`;
  }

  if (hub === "shops" && parts.length === 2) {
    const citySlug = parts[1]!;
    if (resolveCitySlug(citySlug)) {
      return `/houses/${citySlug}?property_type=shop`;
    }
    return `/search?city=${encodeURIComponent(fromSlug(citySlug))}&property_type=shop`;
  }

  if (parts.length === 3 && intent) {
    const [citySlug, areaSlug] = parts.slice(1);
    if (citySlug && areaSlug && resolveAreaSlug(citySlug, areaSlug)) {
      const params = new URLSearchParams();
      if (intent === "buy") {
        params.set("type", "sale");
        params.set("hub", "buy");
      } else if (intent === "land") {
        params.set("hub", "land_sale");
      } else {
        params.set("type", "rent");
      }
      return `/houses/${citySlug}/${areaSlug}?${params.toString()}`;
    }
  }

  return `/search`;
}

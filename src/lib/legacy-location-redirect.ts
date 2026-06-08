import {
  fromSlug,
  resolveAreaSlug,
  resolveCitySlug,
} from "@/lib/location-slugs";
import { RESERVED_PATH_PREFIXES } from "@/lib/public-routes";

/**
 * Legacy SEO URLs like /enugu or /aba/ogbor-hill → /houses/...
 * Unknown short paths → /search (avoid generic 404 dead-ends).
 */
export function legacyLocationRedirect(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  // Static assets (sw.js, boot-splash.js, fonts, etc.) must never become city slugs.
  if (parts.some((part) => part.includes("."))) return null;

  if (parts.length === 1) {
    const slug = parts[0]!;
    if (RESERVED_PATH_PREFIXES.has(slug)) return null;

    if (resolveCitySlug(slug)) {
      return `/houses/${slug}`;
    }

    return "/search";
  }

  if (parts.length === 2) {
    const [citySlug, areaSlug] = parts;
    if (RESERVED_PATH_PREFIXES.has(citySlug)) return null;

    if (resolveAreaSlug(citySlug, areaSlug)) {
      return `/houses/${citySlug}/${areaSlug}`;
    }

    const city = resolveCitySlug(citySlug);
    if (city) {
      const params = new URLSearchParams({
        city: city.city,
        area: fromSlug(areaSlug),
      });
      return `/search?${params.toString()}`;
    }

    return "/search";
  }

  if (parts.length >= 3) {
    const [citySlug, areaSlug] = parts;
    if (RESERVED_PATH_PREFIXES.has(citySlug)) return null;

    if (resolveAreaSlug(citySlug, areaSlug!)) {
      return `/houses/${parts.slice(0, 3).join("/")}`;
    }

    const city = resolveCitySlug(citySlug);
    if (city) {
      const params = new URLSearchParams({ city: city.city });
      if (areaSlug) params.set("area", fromSlug(areaSlug));
      return `/search?${params.toString()}`;
    }

    return "/search";
  }

  return null;
}

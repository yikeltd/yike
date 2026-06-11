import { parseIntentInCityPath } from "@/lib/seo/intent-in-city";

/** Rewrite /rent-in-lagos → internal /intent/rent/lagos (URL bar unchanged). */
export function intentInCityRewrite(pathname: string): string | null {
  const parsed = parseIntentInCityPath(pathname);
  if (!parsed) return null;
  return `/intent/${parsed.intent}/${parsed.citySlug}`;
}

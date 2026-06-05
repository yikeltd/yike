import { buildOgImage, ogContentType, ogSize } from "@/lib/og-image";
import { resolveCitySlug } from "@/lib/location-slugs";
import { generateSeoTitle } from "@/lib/seo/utils";
import { SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Yike city housing guide";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: citySlug } = await params;
  const resolved = resolveCitySlug(citySlug);

  if (!resolved) {
    return buildOgImage({
      title: "Find homes across Nigeria",
      subtitle: SITE_NAME,
    });
  }

  return buildOgImage({
    title: generateSeoTitle("city", resolved.city).replace(` | ${SITE_NAME}`, ""),
    subtitle: `${resolved.state} · Verified agents on WhatsApp`,
  });
}

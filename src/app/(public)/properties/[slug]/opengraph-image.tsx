import { buildOgImage, ogContentType, ogSize } from "@/lib/og-image";
import { resolvePropertyRoute } from "@/lib/properties";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Yike property listing";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { property } = await resolvePropertyRoute(slug);

  if (!property) {
    return buildOgImage({ title: SITE_NAME });
  }

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  return buildOgImage({
    title: property.title,
    subtitle: `${property.area}, ${property.city}`,
    price,
  });
}

import { buildOgImage, ogContentType, ogSize } from "@/lib/og-image";
import { getPropertyById } from "@/lib/properties";
import { formatPrice } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Yike property listing";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyById(id);

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

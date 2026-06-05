import type { Property } from "@/types/database";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export function ListingStructuredData({ property }: { property: Property }) {
  const image =
    property.media_urls[0]?.startsWith("http")
      ? property.media_urls[0]
      : `${SITE_URL}${property.media_urls[0] ?? "/placeholder-property.svg"}`;

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description ?? property.title,
    url: `${SITE_URL}/properties/${property.id}`,
    image: property.media_urls.filter((u) => u.startsWith("http")).slice(0, 5),
    datePosted: property.created_at,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.area,
      addressRegion: property.city,
      addressCountry: "NG",
    },
    offers: {
      "@type": "Offer",
      price: Number(property.price),
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      description: price,
    },
    numberOfRooms: property.bedrooms > 0 ? property.bedrooms : undefined,
    ...(image && { primaryImageOfPage: image }),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

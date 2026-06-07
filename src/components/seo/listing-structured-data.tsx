import type { Property } from "@/types/database";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { ORG_ID } from "@/lib/seo/schema-ids";
import { formatPrice, isVerifiedAgent } from "@/lib/utils";
import { optimizeListingImageUrl } from "@/lib/image-url";
import { propertyAbsoluteUrl } from "@/lib/property-url";
import { agentPublicPath } from "@/lib/agent-slugs";

function absoluteImage(url: string): string {
  if (url.startsWith("http")) return optimizeListingImageUrl(url, 1200);
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ListingStructuredData({ property }: { property: Property }) {
  const pageUrl = propertyAbsoluteUrl(property);
  const images = property.media_urls
    .filter(Boolean)
    .slice(0, 8)
    .map(absoluteImage);

  const price = formatPrice(
    Number(property.price),
    property.payment_period,
    property.listing_type
  );

  const agent = property.agent;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${pageUrl}#listing`,
    name: property.title,
    description: property.description ?? property.title,
    url: pageUrl,
    datePosted: property.created_at,
    identifier: property.id,
    image: images.length > 0 ? images : [`${SITE_URL}/placeholder-property.svg`],
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address_hint ?? property.area,
      addressLocality: property.area,
      addressRegion: `${property.city}, ${property.state}`,
      addressCountry: "NG",
    },
    offers: {
      "@type": "Offer",
      price: Number(property.price),
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      description: price,
      url: pageUrl,
    },
    publisher: { "@id": ORG_ID },
  };

  if (property.bedrooms > 0) schema.numberOfRooms = property.bedrooms;
  if (property.bathrooms > 0) schema.numberOfBathroomsTotal = property.bathrooms;

  if (agent) {
    schema.seller = {
      "@type": "RealEstateAgent",
      name: agent.full_name ?? "Yike Agent",
      url: `${SITE_URL}${agentPublicPath(agent)}`,
      telephone: agent.phone ?? agent.whatsapp ?? undefined,
      ...(isVerifiedAgent(agent) ? { jobTitle: "Verified Agent" } : {}),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

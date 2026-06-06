import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SOCIAL_LINKS,
  COMPANY_DESCRIPTION,
} from "@/lib/constants";
import { ORG_ID, WEBSITE_ID } from "@/lib/seo/schema-ids";

export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Yike Ltd",
        alternateName: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/images/logo.webp`,
          width: 512,
          height: 512,
        },
        description: COMPANY_DESCRIPTION,
        foundingLocation: {
          "@type": "Place",
          name: "Nigeria",
        },
        areaServed: {
          "@type": "Country",
          name: "Nigeria",
        },
        knowsAbout: [
          "Nigerian real estate",
          "Apartments for rent",
          "Houses for sale",
          "Shortlets",
          "Property verification",
        ],
        sameAs: [
          SOCIAL_LINKS.linkedin,
          SOCIAL_LINKS.x,
          SOCIAL_LINKS.tiktok,
          SOCIAL_LINKS.instagram,
          SOCIAL_LINKS.facebook,
          SOCIAL_LINKS.youtube,
        ].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_TAGLINE,
        publisher: { "@id": ORG_ID },
        inLanguage: "en-NG",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?city={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

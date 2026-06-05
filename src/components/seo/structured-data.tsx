import { SITE_NAME, SITE_TAGLINE, SITE_URL, SOCIAL_LINKS } from "@/lib/constants";

export function StructuredData() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo.webp`,
    description: SITE_TAGLINE,
    sameAs: [
      SOCIAL_LINKS.tiktok,
      SOCIAL_LINKS.x,
      SOCIAL_LINKS.youtube,
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.facebook,
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?city={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}

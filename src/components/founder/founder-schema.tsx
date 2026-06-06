import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { FOUNDER } from "./founder-story-content";

const PAGE_URL = `${SITE_URL}/${FOUNDER.slug}`;

export function FounderSchema() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${PAGE_URL}#profile`,
        url: PAGE_URL,
        name: `${FOUNDER.name} — Founder of ${SITE_NAME}`,
        description:
          "Founder story of Odogwu Stankings, Nigerian tech entrepreneur and PropTech founder behind Yike.ng.",
        inLanguage: "en-NG",
        mainEntity: { "@id": `${PAGE_URL}#person` },
      },
      {
        "@type": "Person",
        "@id": `${PAGE_URL}#person`,
        name: FOUNDER.name,
        alternateName: "Odogwu Stankings",
        url: PAGE_URL,
        jobTitle: FOUNDER.title,
        description:
          "Nigerian entrepreneur, PropTech founder, and builder of Yike — a trust-first real estate marketplace for Nigeria. Background includes Aba hustle, Dubai business experience, Stankings Autos, and full-time technology focus.",
        nationality: {
          "@type": "Country",
          name: "Nigeria",
        },
        homeLocation: {
          "@type": "Place",
          name: "Nigeria",
        },
        worksFor: {
          "@type": "Organization",
          name: "Yike Ltd",
          url: SITE_URL,
        },
        knowsAbout: [
          "PropTech",
          "Nigerian real estate",
          "Startup founding",
          "Product development",
          "Automotive business",
          "Digital marketing",
        ],
        alumniOf: {
          "@type": "EducationalOrganization",
          name: "Nigerian secondary and university education",
        },
        sameAs: [SITE_URL],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: FOUNDER.name,
            item: PAGE_URL,
          },
        ],
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

import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { ORG_ID, WEBSITE_ID } from "@/lib/seo/schema-ids";

export function LocationPageSchema({
  pageUrl,
  pageName,
  description,
  breadcrumbs,
}: {
  pageUrl: string;
  pageName: string;
  description: string;
  breadcrumbs: { name: string; href: string }[];
}) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageName,
        description,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        about: {
          "@type": "Place",
          name: pageName,
          address: { "@type": "PostalAddress", addressCountry: "NG" },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.href.startsWith("http") ? b.href : `${SITE_URL}${b.href}`,
        })),
      },
      {
        "@type": "CollectionPage",
        name: `${pageName} | ${SITE_NAME}`,
        url: pageUrl,
        description,
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

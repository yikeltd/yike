import type { Property } from "@/types/database";
import type { BreadcrumbItem } from "@/lib/seo/utils";
import type { SeoFaq } from "@/lib/seo/content";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { optimizeListingImageUrl } from "@/lib/image-url";

export function SeoStructuredData({
  pageUrl,
  pageName,
  description,
  breadcrumbs,
  faqs,
  listings,
}: {
  pageUrl: string;
  pageName: string;
  description: string;
  breadcrumbs: BreadcrumbItem[];
  faqs?: SeoFaq[];
  listings?: Property[];
}) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageName,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.label,
        item: b.href.startsWith("http") ? b.href : `${SITE_URL}${b.href}`,
      })),
    },
  ];

  if (faqs && faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  if (listings && listings.length > 0) {
    graph.push({
      "@type": "ItemList",
      name: `${pageName} — listings`,
      numberOfItems: listings.length,
      itemListElement: listings.slice(0, 12).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/properties/${p.id}`,
        name: p.title,
        image: p.media_urls[0]?.startsWith("http")
          ? optimizeListingImageUrl(p.media_urls[0], 800)
          : `${SITE_URL}/placeholder-property.svg`,
      })),
    });
  }

  const json = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

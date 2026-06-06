import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { ORG_ID } from "@/lib/seo/schema-ids";
import type { BlogPost } from "@/constants/blogTopics";

export function ArticleStructuredData({
  post,
  url,
}: {
  post: BlogPost;
  url: string;
}) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.excerpt,
      url,
      datePublished: post.createdAt,
      dateModified: post.updatedAt,
      inLanguage: "en-NG",
      author: {
        "@type": "Organization",
        "@id": ORG_ID,
        name: `${SITE_NAME} Editorial Team`,
      },
      publisher: {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE_NAME,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/images/logo.webp`,
        },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
  ];

  if (post.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
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

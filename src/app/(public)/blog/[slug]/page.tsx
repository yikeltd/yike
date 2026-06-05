import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBlogPost,
  getRelatedBlogPosts,
  getAllBlogSlugs,
  getBlogCategoryLabel,
} from "@/constants/blogTopics";
import { blogCanonical } from "@/lib/seo/utils";
import { SeoFAQ } from "@/components/seo/programmatic/seo-faq";
import { InternalLinkGrid } from "@/components/seo/programmatic/internal-link-grid";
import { BlogCard } from "@/components/seo/programmatic/blog-card";
import { ConversionStrip } from "@/components/conversion/conversion-strip";
import { SafetyNotice } from "@/components/property/safety-notice";
import { SITE_NAME } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Blog | Yike" };

  const url = blogCanonical(slug);
  return {
    title: `${post.title} | ${SITE_NAME}`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      siteName: SITE_NAME,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const related = getRelatedBlogPosts(post, 3);
  const url = blogCanonical(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Yike Editorial Team" },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return (
    <article className="pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/blog" className="text-sm font-bold text-gold-dark hover:underline">
        ← All guides
      </Link>

      <header className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
          {getBlogCategoryLabel(post.category)}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-navy lg:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-muted lg:text-base">{post.excerpt}</p>
        <p className="mt-2 text-xs text-muted">
          By Yike Editorial Team · Updated{" "}
          {new Date(post.updatedAt).toLocaleDateString("en-NG", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </header>

      <div className="mt-8 max-w-3xl space-y-8">
        {post.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-bold text-navy">{s.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted lg:text-base">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      <SeoFAQ faqs={post.faqs} />

      <InternalLinkGrid title="Related links" links={post.relatedLinks} />

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-navy">Related guides</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 space-y-6">
        <SafetyNotice compact />
        <ConversionStrip />
      </div>
    </article>
  );
}

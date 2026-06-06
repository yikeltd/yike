import type { Metadata } from "next";
import Link from "next/link";
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
import { RouteFallback } from "@/components/layout/route-fallback";
import { ConversionStrip } from "@/components/conversion/conversion-strip";
import { SafetyNotice } from "@/components/property/safety-notice";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { ArticleStructuredData } from "@/components/seo/article-structured-data";

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
      images: [{ url: `${SITE_URL}/images/logo.webp`, width: 512, height: 512 }],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) {
    return (
      <div className="pb-12">
        <RouteFallback
          title="Guide not found"
          message="That article may have moved — browse our guides or search homes instead."
          pathHint={slug}
        />
        <div className="mx-auto max-w-3xl px-3 lg:px-8">
          <Link href="/blog" className="text-sm font-bold text-gold-dark hover:underline">
            ← All guides
          </Link>
        </div>
      </div>
    );
  }

  const related = getRelatedBlogPosts(post, 3);
  const url = blogCanonical(slug);

  return (
    <article className="pb-12">
      <ArticleStructuredData post={post} url={url} />

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

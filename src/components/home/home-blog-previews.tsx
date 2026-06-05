import Link from "next/link";
import { getBlogPosts } from "@/constants/blogTopics";
import { BlogCard } from "@/components/seo/programmatic/blog-card";

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between px-3 lg:px-0">
      <div>
        <h2 className="text-lg font-bold text-navy lg:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <Link
        href={href}
        className="text-sm font-bold text-gold-dark hover:underline"
      >
        All guides
      </Link>
    </div>
  );
}

export function HomeBlogPreviews() {
  const posts = getBlogPosts(6).slice(0, 3);

  return (
    <section className="mt-8 lg:mt-12">
      <SectionHeader
        title="Rental guides"
        subtitle="Budget tips, area guides & scam prevention"
        href="/blog"
      />
      <div className="grid gap-3 px-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 lg:px-0">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

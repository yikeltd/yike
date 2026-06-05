import Link from "next/link";
import { getBlogPosts } from "@/constants/blogTopics";
import { BlogCard } from "@/components/seo/programmatic/blog-card";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Rental Guides & Tips | ${SITE_NAME}`,
  description:
    "City rental guides, scam prevention, student housing tips and neighborhood insights for Nigerian renters.",
};

export default function BlogIndexPage() {
  const posts = getBlogPosts(48);

  return (
    <div className="pb-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-navy lg:text-3xl">
          Rental guides & tips
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted lg:text-base">
          Practical guides for renting in Nigeria — safety, budgets, neighborhoods
          and how to use Yike without agent drama.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted">
        <Link href="/search" className="font-bold text-gold-dark hover:underline">
          Browse live listings →
        </Link>
      </p>
    </div>
  );
}

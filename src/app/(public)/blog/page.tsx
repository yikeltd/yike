import Link from "next/link";
import { getBlogPosts } from "@/constants/blogTopics";
import { BlogCard } from "@/components/seo/programmatic/blog-card";
import { PageHero } from "@/components/pages/page-hero";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { ExploreHubLinks } from "@/components/pages/explore-hub-links";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Rental Guides & Tips | ${SITE_NAME}`,
  description:
    "City rental guides, scam prevention, student housing tips and neighborhood insights for Nigerian renters.",
};

const TOPICS = [
  { label: "Before you pay rent", href: "/blog/before-you-pay-rent-in-lagos-read-this" },
  { label: "Rental red flags", href: "/blog/10-red-flags-before-paying-for-an-apartment" },
  { label: "Spot fake agents", href: "/blog/how-to-know-if-a-nigerian-agent-is-real" },
  { label: "Student housing", href: "/blog/student-housing-guide-enugu" },
  { label: "Self contain costs", href: "/blog/cost-of-self-contain-in-aba" },
];

export default function BlogIndexPage() {
  const posts = getBlogPosts(48);

  return (
    <div className="pb-12">
      <PageHero
        title="Rental guides & tips"
        subtitle="Practical advice for renting in Nigeria — budgets, neighborhoods, scams and how to use Yike without agent drama."
        image={PAGE_IMAGERY.student}
        badge="Guides"
        variant="default"
        cta={{ label: "Browse listings", href: "/search" }}
        secondaryCta={{ label: "Request a home", href: "/request-property" }}
      />

      <div className="mx-auto max-w-7xl px-3 pt-8 lg:px-8">
        <ExploreHubLinks active="/blog" className="mb-6" />

        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="pressable rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-float hover:bg-gold/10"
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

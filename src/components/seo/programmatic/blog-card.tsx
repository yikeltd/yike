import Link from "next/link";
import type { BlogPost } from "@/constants/blogTopics";
import { getBlogCategoryLabel } from "@/constants/blogTopics";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="pressable block rounded-2xl bg-elevated p-5 shadow-float ring-1 ring-black/[0.04] transition-shadow hover:shadow-float-lg dark:ring-white/[0.06]"
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-gold-dark">
        {getBlogCategoryLabel(post.category)}
      </p>
      <h3 className="mt-2 text-base font-bold leading-snug text-navy">{post.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
    </Link>
  );
}

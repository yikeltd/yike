import { buildOgImage, ogContentType, ogSize } from "@/lib/og-image";
import { getBlogPost, getBlogCategoryLabel } from "@/constants/blogTopics";
import { SITE_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = "Yike housing guide";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return buildOgImage({
      title: "Rental guides & housing tips",
      subtitle: SITE_NAME,
    });
  }

  return buildOgImage({
    eyebrow: getBlogCategoryLabel(post.category),
    title: post.title,
    subtitle: `${SITE_NAME} · Nigeria housing`,
  });
}

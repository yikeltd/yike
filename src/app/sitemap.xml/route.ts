import { buildSitemapXml, getAllSitemapUrls } from "@/lib/seo/sitemap-xml";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const urls = await getAllSitemapUrls();
  const xml = buildSitemapXml(urls);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

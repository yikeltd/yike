import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { parseServiceSeoSlug } from "@/constants/serviceProviders";
import { getServiceProviderTypeLabel } from "@/constants/serviceProviders";
import { isHomeServicesEnabled } from "@/lib/feature-flags";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const joined = slug?.join("/") ?? "";
  const parsed = parseServiceSeoSlug(joined);
  if (!isHomeServicesEnabled() || !parsed) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return {
    title: `${getServiceProviderTypeLabel(parsed.providerType)} in ${parsed.city} | Yike`,
    description: `Trusted ${getServiceProviderTypeLabel(parsed.providerType).toLowerCase()} services in ${parsed.city}.`,
    robots: { index: true, follow: true },
  };
}

/** Future SEO hub — returns 404 until ENABLE_HOME_SERVICES=true */
export default async function ServicesSeoPage({ params }: PageProps) {
  if (!isHomeServicesEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const joined = slug?.join("/") ?? "";
  const parsed = parseServiceSeoSlug(joined);
  if (!parsed) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-navy">
        {getServiceProviderTypeLabel(parsed.providerType)} in {parsed.city}
      </h1>
      <p className="mt-3 text-sm text-muted">
        Trusted home services on Yike — coming soon for this area.
      </p>
    </main>
  );
}

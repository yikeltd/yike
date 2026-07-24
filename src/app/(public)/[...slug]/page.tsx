import { redirect } from "next/navigation";
import { RouteFallback } from "@/components/layout/route-fallback";
import { internalPrefixRedirect } from "@/lib/route-redirects";

type Props = {
  params: Promise<{ slug: string[] }>;
};

/**
 * Public catch-all for unknown paths.
 *
 * Turbopack can occasionally prefer this route over sibling dynamic trees
 * (`/properties/[slug]`, `/vehicles/[slug]`). When that happens, delegate to
 * the real listing page modules so detail UI still renders.
 */
export default async function CatchAllPublicPage({ params }: Props) {
  const { slug } = await params;

  if (slug[0] === "properties" && slug[1] && slug.length === 2) {
    const { default: PropertyDetailPage } = await import(
      "../properties/[slug]/page"
    );
    return PropertyDetailPage({
      params: Promise.resolve({ slug: slug[1]! }),
    });
  }

  if (slug[0] === "vehicles" && slug[1] && slug.length === 2) {
    const { default: VehicleDetailPage } = await import(
      "../vehicles/[slug]/page"
    );
    return VehicleDetailPage({
      params: Promise.resolve({ slug: slug[1]! }),
    });
  }

  const reservedTarget = internalPrefixRedirect(slug);
  if (reservedTarget) redirect(reservedTarget);

  const pathHint = slug.join("/");

  return (
    <RouteFallback
      pathHint={pathHint}
      message="We couldn't find that exact page, but here are related homes you can browse."
    />
  );
}

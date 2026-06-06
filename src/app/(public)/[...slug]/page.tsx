import { redirect } from "next/navigation";
import { RouteFallback } from "@/components/layout/route-fallback";
import { internalPrefixRedirect } from "@/lib/route-redirects";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function CatchAllPublicPage({ params }: Props) {
  const { slug } = await params;
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

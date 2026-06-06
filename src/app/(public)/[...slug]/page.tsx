import { RouteFallback } from "@/components/layout/route-fallback";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function CatchAllPublicPage({ params }: Props) {
  const { slug } = await params;
  const pathHint = slug.join("/");

  return (
    <RouteFallback
      pathHint={pathHint}
      message="We couldn't find that exact page, but here are related homes you can browse."
    />
  );
}

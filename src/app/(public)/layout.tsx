import type { Metadata } from "next";
import { headers } from "next/headers";
import { ConsumerShell } from "@/components/layout/consumer-shell";
import { ConditionalPublicFooter } from "@/components/layout/conditional-public-footer";
import { PublicFooter } from "@/components/layout/public-footer";
import { getActiveMobileHeaderBanner } from "@/lib/site-banners";
import { pageCanonical } from "@/lib/seo/utils";

const NO_CANONICAL_PREFIXES = [
  "/auth",
  "/agent",
  "/lex",
  "/staff",
  "/profile",
  "/saved",
  "/intent",
  "/api",
  "/account",
];

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-yike-pathname") ?? "";
  if (!pathname || NO_CANONICAL_PREFIXES.some((p) => pathname.startsWith(p))) {
    return {};
  }
  return { alternates: { canonical: pageCanonical(pathname) } };
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mobileBanner = await getActiveMobileHeaderBanner();

  return (
    <>
      <ConsumerShell mobileBanner={mobileBanner}>{children}</ConsumerShell>
      <ConditionalPublicFooter>
        <PublicFooter />
      </ConditionalPublicFooter>
    </>
  );
}

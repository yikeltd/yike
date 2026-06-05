import { ConsumerShell } from "@/components/layout/consumer-shell";
import { ConditionalPublicFooter } from "@/components/layout/conditional-public-footer";
import { PublicFooter } from "@/components/layout/public-footer";
import { getActiveMobileHeaderBanner } from "@/lib/site-banners";

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

import { ConsumerShell } from "@/components/layout/consumer-shell";
import { ConditionalPublicFooter } from "@/components/layout/conditional-public-footer";
import { PublicFooter } from "@/components/layout/public-footer";

/** Standard marketplace chrome: mobile header, bottom nav, desktop header. */
export function ConsumerMarketplaceShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConsumerShell>{children}</ConsumerShell>
      <ConditionalPublicFooter>
        <PublicFooter />
      </ConditionalPublicFooter>
    </>
  );
}

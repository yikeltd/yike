import { ConsumerShell } from "@/components/layout/consumer-shell";
import { ConditionalPublicFooter } from "@/components/layout/conditional-public-footer";
import { PublicFooter } from "@/components/layout/public-footer";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConsumerShell>
        {children}
      </ConsumerShell>
      <ConditionalPublicFooter>
        <PublicFooter />
      </ConditionalPublicFooter>
    </>
  );
}

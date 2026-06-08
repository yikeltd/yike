import { ConsumerShell } from "@/components/layout/consumer-shell";
import { ConditionalPublicFooter } from "@/components/layout/conditional-public-footer";
import { PublicFooter } from "@/components/layout/public-footer";
import { AgentTrustGateBanner } from "@/components/verification/agent-trust-gate-banner";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConsumerShell>
        <AgentTrustGateBanner />
        {children}
      </ConsumerShell>
      <ConditionalPublicFooter>
        <PublicFooter />
      </ConditionalPublicFooter>
    </>
  );
}

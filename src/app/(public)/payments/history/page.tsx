import { PaymentHistoryClient } from "./payment-history-client";
import { ConsumerSubpageHeader } from "@/components/layout/consumer-subpage-header";
import {
  parseWalletFromParam,
  walletPath,
} from "@/lib/navigation/account-routes";

export const metadata = {
  title: "Payment history · Yike",
  robots: { index: false, follow: false },
};

export default async function PaymentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from: fromRaw } = await searchParams;
  const walletFrom = parseWalletFromParam(fromRaw);

  return (
    <div className="mx-auto max-w-lg px-2 py-6 sm:px-4 lg:py-10">
      <ConsumerSubpageHeader
        title="Payment history"
        subtitle="Boosts, featured listings, and plan payments."
        backHref={walletPath(walletFrom ? { from: walletFrom } : undefined)}
        backLabel="Back to Yike Coins"
      />
      <div className="mt-2">
        <PaymentHistoryClient />
      </div>
    </div>
  );
}

import { PaymentHistoryClient } from "./payment-history-client";

export const metadata = {
  title: "Payment history · Yike",
  robots: { index: false, follow: false },
};

export default function PaymentHistoryPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold text-navy">Payment history</h1>
      <p className="mt-1 text-sm text-muted">Boosts, featured listings, and plan payments.</p>
      <div className="mt-6">
        <PaymentHistoryClient />
      </div>
    </div>
  );
}

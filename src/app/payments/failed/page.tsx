import { Suspense } from "react";
import { PaymentResultClient } from "../_shared/payment-result-client";

export const metadata = {
  title: "Payment failed · Yike",
  robots: { index: false, follow: false },
};

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Loading…</p>}>
      <PaymentResultClient variant="failed" />
    </Suspense>
  );
}

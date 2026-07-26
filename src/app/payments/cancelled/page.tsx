import { Suspense } from "react";
import { PaymentResultClient } from "../_shared/payment-result-client";

export const metadata = {
  title: "Payment cancelled · Yike",
  robots: { index: false, follow: false },
};

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-muted">Loading…</p>}>
      <PaymentResultClient variant="cancelled" />
    </Suspense>
  );
}

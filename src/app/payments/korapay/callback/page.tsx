import { Suspense } from "react";
import { PaymentCallbackClient } from "../../callback/payment-callback-client";

export const metadata = {
  title: "Processing Korapay payment · Yike",
  robots: { index: false, follow: false },
};

export default function KorapayCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70dvh] max-w-lg items-center justify-center px-4">
          <p className="text-sm text-muted">Processing Korapay Payment…</p>
        </div>
      }
    >
      <PaymentCallbackClient />
    </Suspense>
  );
}

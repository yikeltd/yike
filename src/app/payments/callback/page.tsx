import { Suspense } from "react";
import { PaymentCallbackClient } from "./payment-callback-client";

export const metadata = {
  title: "Processing payment · Yike",
  robots: { index: false, follow: false },
};

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70dvh] max-w-lg items-center justify-center px-4">
          <p className="text-sm text-muted">Processing…</p>
        </div>
      }
    >
      <PaymentCallbackClient />
    </Suspense>
  );
}

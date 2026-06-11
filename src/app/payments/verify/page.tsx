import { Suspense } from "react";
import { PaymentVerifyClient } from "./payment-verify-client";

export default function PaymentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70dvh] max-w-lg items-center justify-center px-4">
          <p className="text-sm text-muted">Confirming your payment…</p>
        </div>
      }
    >
      <PaymentVerifyClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import { VerifyPhoneClient } from "./verify-phone-client";

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<p className="pt-8 text-center text-sm text-muted">Loading…</p>}>
      <VerifyPhoneClient />
    </Suspense>
  );
}

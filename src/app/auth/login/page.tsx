import { Suspense } from "react";
import { AuthLoginAd } from "@/components/ads/auth-login-ad";
import { LoginClient } from "./login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient belowLegal={<AuthLoginAd />} />
    </Suspense>
  );
}

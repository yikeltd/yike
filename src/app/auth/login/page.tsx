import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthLoginAd } from "@/components/ads/auth-login-ad";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { LoginClient } from "./login-client";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  if (rawNext) {
    const safe = safeNextPath(rawNext, "/");
    if (safe !== rawNext) {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value == null) continue;
        if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
        else qs.set(key, value);
      }
      qs.set("next", safe);
      redirect(`/auth/login?${qs.toString()}`);
    }
  }

  return (
    <Suspense fallback={null}>
      <LoginClient belowLegal={<AuthLoginAd />} />
    </Suspense>
  );
}

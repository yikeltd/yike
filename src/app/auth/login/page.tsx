import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthLoginAd } from "@/components/ads/auth-login-ad";
import {
  CONSUMER_AUTH_DEFAULT_NEXT,
  safeConsumerAuthNext,
} from "@/lib/auth/safe-next-path";
import { getOrCreateOwnProfile, getSession, isEmailVerified } from "@/lib/auth";
import { resolveProfilePath } from "@/lib/account/account-home";
import { LoginClient } from "./login-client";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const safeNext = safeConsumerAuthNext(rawNext, CONSUMER_AUTH_DEFAULT_NEXT);

  const sessionUser = await getSession();
  if (sessionUser) {
    const profile = await getOrCreateOwnProfile(sessionUser);
    if (profile && isEmailVerified(sessionUser, profile)) {
      redirect(safeNext);
    }
  }

  if (rawNext) {
    const safe = safeNext;
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

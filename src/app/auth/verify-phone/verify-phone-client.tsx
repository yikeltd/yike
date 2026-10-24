"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { PhoneSmsVerificationPanel } from "@/components/profile/phone-sms-verification-panel";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";
import { getSellerContactPhone } from "@/lib/phone-verification/profile";
import type { Profile } from "@/types/database";
import { PROFILES_SAFE_SELECT } from "@/lib/profile/safe-select";

const SESSION_LOAD_ERROR =
  "We could not load your session. Check your connection and try again.";

function VerifyPhoneLoading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gold" aria-label="Loading" />
    </div>
  );
}

export function VerifyPhoneClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"), "/agent/listings/choose");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    setChecking(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user) {
        const verifyPath = `/auth/verify-phone?next=${encodeURIComponent(nextPath)}`;
        router.replace(`/auth/login?next=${encodeURIComponent(verifyPath)}`);
        return;
      }

      if (userError) {
        setLoadError(SESSION_LOAD_ERROR);
        return;
      }

      const { data: prof, error: profileError } = await supabase
        .from("profiles")
        .select(PROFILES_SAFE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setLoadError(SESSION_LOAD_ERROR);
        return;
      }

      setProfile(prof as Profile | null);
    } catch {
      setLoadError(SESSION_LOAD_ERROR);
    } finally {
      setChecking(false);
    }
  }, [nextPath, router]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (profile && isPhoneVerifiedForSeller(profile)) {
      router.replace(nextPath);
    }
  }, [profile, nextPath, router]);

  if (checking) {
    return <VerifyPhoneLoading />;
  }

  if (loadError) {
    return (
      <AuthShell
        title={PHONE_VERIFY_COPY.screenTitle}
        subtitle="We could not load your account right now."
        footer={
          <Link href="/auth/login" className="text-sm font-semibold text-gold-dark">
            Back to sign in
          </Link>
        }
      >
        <p className="text-center text-sm text-muted">{loadError}</p>
        <Button type="button" fullWidth size="lg" className="mt-4" onClick={() => void reload()}>
          Try again
        </Button>
      </AuthShell>
    );
  }

  if (!profile) {
    return (
      <AuthShell
        title={PHONE_VERIFY_COPY.screenTitle}
        subtitle="Profile not found."
        footer={
          <Link href="/agent" className="text-sm font-semibold text-gold-dark">
            Seller home
          </Link>
        }
      >
        <p className="text-center text-sm text-muted">
          Complete seller setup, then return here to verify your phone.
        </p>
      </AuthShell>
    );
  }

  const verified = isPhoneVerifiedForSeller(profile);

  return (
    <AuthShell
      title={PHONE_VERIFY_COPY.screenTitle}
      subtitle={PHONE_VERIFY_COPY.screenBody}
      footer={
        <Link href="/agent" className="text-sm font-semibold text-gold-dark">
          ← Back to seller home
        </Link>
      }
    >
      <p className="mb-4 text-center text-xs text-muted">{PHONE_VERIFY_COPY.browseHint}</p>

      {verified ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">{PHONE_VERIFY_COPY.verified}</p>
          <Button type="button" className="w-full" onClick={() => router.push(nextPath)}>
            Continue
          </Button>
        </div>
      ) : (
        <PhoneSmsVerificationPanel
          phoneNumber={getSellerContactPhone(profile)}
          onVerified={() => {
            void reload();
            router.push(nextPath);
          }}
        />
      )}
    </AuthShell>
  );
}

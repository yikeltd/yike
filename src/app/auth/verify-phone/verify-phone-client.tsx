"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhoneSmsVerificationPanel } from "@/components/profile/phone-sms-verification-panel";
import { Button } from "@/components/ui/button";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";
import { getWhatsappNumber } from "@/lib/whatsapp-verification/profile";
import type { Profile } from "@/types/database";
import { PROFILES_SAFE_SELECT } from "@/lib/profile/safe-select";

export function VerifyPhoneClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/agent/listings/new";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth/login?next=${encodeURIComponent(`/auth/verify-phone?next=${nextPath}`)}`;
      return;
    }
    const { data: prof } = await supabase
      .from("profiles")
      .select(PROFILES_SAFE_SELECT)
      .eq("id", user.id)
      .maybeSingle();
    setProfile(prof as Profile | null);
    setLoading(false);
  }, [nextPath]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (profile && isPhoneVerifiedForSeller(profile)) {
      router.replace(nextPath);
    }
  }, [profile, nextPath, router]);

  if (loading) {
    return <p className="pt-8 text-center text-sm text-muted">Loading…</p>;
  }

  if (!profile) {
    return <p className="pt-8 text-center text-sm text-muted">Profile not found.</p>;
  }

  const verified = isPhoneVerifiedForSeller(profile);

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pt-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          {PHONE_VERIFY_COPY.screenTitle}
        </h1>
        <p className="mt-2 text-sm text-muted">{PHONE_VERIFY_COPY.screenBody}</p>
        <p className="mt-1.5 text-xs text-muted">{PHONE_VERIFY_COPY.browseHint}</p>
      </div>

      {verified ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">{PHONE_VERIFY_COPY.verified}</p>
          <Button type="button" className="w-full" onClick={() => router.push(nextPath)}>
            Continue
          </Button>
        </div>
      ) : (
        <PhoneSmsVerificationPanel
          phoneNumber={getWhatsappNumber(profile)}
          onVerified={() => {
            void reload();
            router.push(nextPath);
          }}
        />
      )}

      <Link href="/agent" className="inline-flex text-xs font-semibold text-gold-dark hover:underline">
        ← Back to seller home
      </Link>
    </div>
  );
}

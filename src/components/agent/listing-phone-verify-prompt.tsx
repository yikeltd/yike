"use client";

import type { Profile } from "@/types/database";
import { mustVerifyPhoneBeforeListing } from "@/lib/seller-trust/gates";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";
import { PhoneVerificationCard } from "@/components/profile/phone-verification-card";

export function ListingPhoneVerifyPrompt({ profile }: { profile: Profile }) {
  const show =
    mustVerifyPhoneBeforeListing(profile) && !isPhoneVerifiedForSeller(profile);

  if (!show) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-navy">{PHONE_VERIFY_COPY.listingGate}</p>
        <p className="text-xs text-muted">{PHONE_VERIFY_COPY.profileTitle}</p>
        <PhoneVerificationCard profile={profile} forceShow />
      </div>
    </div>
  );
}

/** @deprecated */
export const ListingWhatsappVerifyPrompt = ListingPhoneVerifyPrompt;

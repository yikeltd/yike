"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";
import {
  getSellerContactPhone,
  isPhoneVerificationFeatureActive,
} from "@/lib/phone-verification/profile";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";
import { PhoneSmsVerificationPanel } from "@/components/profile/phone-sms-verification-panel";
import { VerificationOptionCard } from "@/components/verification/verification-option-card";
import { Button } from "@/components/ui/button";

export function PhoneVerificationCard({
  profile,
  onVerified,
  forceShow = false,
}: {
  profile: Profile;
  onVerified?: () => void;
  /** Always show when seller must verify phone before listing. */
  forceShow?: boolean;
}) {
  const [expanded, setExpanded] = useState(forceShow);

  const verified = isPhoneVerifiedForSeller(profile);
  const smsActive = isPhoneVerificationFeatureActive(profile);

  if (forceShow) {
    if (verified) {
      return (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">{PHONE_VERIFY_COPY.verified}</p>
          {onVerified ? (
            <Button type="button" className="w-full" onClick={() => onVerified()}>
              Continue
            </Button>
          ) : null}
        </div>
      );
    }

    return (
      <PhoneSmsVerificationPanel
        phoneNumber={getSellerContactPhone(profile)}
        onVerified={onVerified}
        compact
      />
    );
  }

  if (!smsActive && !verified) return null;

  return (
    <>
      <VerificationOptionCard
        title={PHONE_VERIFY_COPY.cardTitle}
        status={
          verified ? PHONE_VERIFY_COPY.verifiedStatus : PHONE_VERIFY_COPY.requiredToList
        }
        statusVariant={verified ? "success" : "neutral"}
        actionLabel={verified ? undefined : PHONE_VERIFY_COPY.screenTitle}
        onAction={
          verified
            ? undefined
            : () => {
                setExpanded(true);
              }
        }
        disabled={verified}
      />

      {expanded && !verified ? (
        <div className="mt-3">
          <PhoneSmsVerificationPanel
            phoneNumber={getSellerContactPhone(profile)}
            onVerified={onVerified}
            compact
          />
        </div>
      ) : null}
    </>
  );
}

/** @deprecated use PhoneVerificationCard */
export const WhatsAppVerificationCard = PhoneVerificationCard;

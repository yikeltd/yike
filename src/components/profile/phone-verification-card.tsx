"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import {
  isWhatsappNumberVerified,
  isWhatsappVerificationFeatureActive,
  getWhatsappNumber,
} from "@/lib/whatsapp-verification/profile";
import { isPhoneVerifiedForSeller } from "@/lib/seller-trust";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";
import { PhoneSmsVerificationPanel } from "@/components/profile/phone-sms-verification-panel";
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
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
  const [waModalOpen, setWaModalOpen] = useState(false);

  const phoneVerified = isPhoneVerifiedForSeller(profile);
  const waActive = isWhatsappVerificationFeatureActive(profile);
  const verified = phoneVerified || isWhatsappNumberVerified(profile);

  // Seller listing gate → SMS OTP primary.
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
        phoneNumber={getWhatsappNumber(profile)}
        onVerified={onVerified}
        compact
      />
    );
  }

  if (!waActive && !verified) return null;

  return (
    <>
      <VerificationOptionCard
        title={PHONE_VERIFY_COPY.cardTitle}
        status={
          verified
            ? WHATSAPP_VERIFY_COPY.verifiedStatus
            : PHONE_VERIFY_COPY.requiredToList
        }
        statusVariant={verified ? "success" : "neutral"}
        actionLabel={verified ? undefined : PHONE_VERIFY_COPY.screenTitle}
        onAction={
          verified
            ? undefined
            : () => {
                setExpanded(true);
                setWaModalOpen(false);
              }
        }
        disabled={verified}
      />

      {expanded && !verified ? (
        <div className="mt-3">
          <PhoneSmsVerificationPanel
            phoneNumber={getWhatsappNumber(profile)}
            onVerified={onVerified}
            compact
          />
        </div>
      ) : null}

      {/* Legacy WhatsApp Business path — only when explicitly enabled. */}
      {waActive && process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_OTP === "true" ? (
        <WhatsAppVerificationModal
          open={waModalOpen}
          onOpenChange={setWaModalOpen}
          phoneNumber={getWhatsappNumber(profile)}
          onVerified={onVerified}
        />
      ) : null}
    </>
  );
}

/** @deprecated use PhoneVerificationCard */
export const WhatsAppVerificationCard = PhoneVerificationCard;

"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import {
  isWhatsappNumberVerified,
  isWhatsappVerificationFeatureActive,
  getWhatsappNumber,
} from "@/lib/whatsapp-verification/profile";
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
import { VerificationOptionCard } from "@/components/verification/verification-option-card";

export function PhoneVerificationCard({
  profile,
  onVerified,
}: {
  profile: Profile;
  onVerified?: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const active = isWhatsappVerificationFeatureActive(profile);
  const verified = isWhatsappNumberVerified(profile);

  if (!active && !verified) return null;

  return (
    <>
      <VerificationOptionCard
        title={WHATSAPP_VERIFY_COPY.cardTitle}
        status={
          verified
            ? WHATSAPP_VERIFY_COPY.verifiedStatus
            : WHATSAPP_VERIFY_COPY.notVerifiedStatus
        }
        statusVariant={verified ? "success" : "neutral"}
        actionLabel={verified ? undefined : WHATSAPP_VERIFY_COPY.profileTitle}
        onAction={verified ? undefined : () => setModalOpen(true)}
        disabled={verified}
      />

      <WhatsAppVerificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        phoneNumber={getWhatsappNumber(profile)}
        onVerified={onVerified}
      />
    </>
  );
}

/** @deprecated use PhoneVerificationCard */
export const WhatsAppVerificationCard = PhoneVerificationCard;

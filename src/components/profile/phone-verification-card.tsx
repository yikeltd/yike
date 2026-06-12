"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import {
  isWhatsappNumberVerified,
  isWhatsappVerificationFeatureActive,
} from "@/lib/whatsapp-verification/profile";
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
import { getWhatsappNumber } from "@/lib/whatsapp-verification/profile";
import { formatWhatsappDisplay } from "@/lib/phone";

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
  const displayPhone = formatWhatsappDisplay(getWhatsappNumber(profile));

  if (!active || verified) return null;

  return (
    <>
      <section className="rounded-2xl border border-border bg-elevated p-4 shadow-float">
        <h2 className="text-sm font-bold text-navy">{WHATSAPP_VERIFY_COPY.profileTitle}</h2>
        <p className="mt-1 text-xs text-muted">{WHATSAPP_VERIFY_COPY.profileDescription}</p>
        {displayPhone !== "—" ? (
          <p className="mt-3 text-sm font-semibold text-foreground">{displayPhone}</p>
        ) : null}
        <Button
          type="button"
          className="mt-3 w-full"
          onClick={() => setModalOpen(true)}
        >
          {WHATSAPP_VERIFY_COPY.primaryButton}
        </Button>
      </section>

      <WhatsAppVerificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        phoneNumber={getWhatsappNumber(profile)}
        onVerified={onVerified}
      />
    </>
  );
}

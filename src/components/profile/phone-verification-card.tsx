"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Profile } from "@/types/database";
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
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="pressable flex w-full items-center gap-3 rounded-2xl border border-border bg-elevated p-4 text-left shadow-float"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-navy">{WHATSAPP_VERIFY_COPY.profileTitle}</p>
          <p className="mt-0.5 text-xs text-muted">{WHATSAPP_VERIFY_COPY.profileDescription}</p>
          {displayPhone !== "—" ? (
            <p className="mt-2 text-sm font-semibold text-foreground">{displayPhone}</p>
          ) : null}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      </button>

      <WhatsAppVerificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        phoneNumber={getWhatsappNumber(profile)}
        onVerified={onVerified}
      />
    </>
  );
}

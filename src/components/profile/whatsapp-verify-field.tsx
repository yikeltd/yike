"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import { normalizeNigerianPhone } from "@/lib/phone";
import type { Profile } from "@/types/database";
import {
  getWhatsappNumber,
  isWhatsappNumberVerified,
  isWhatsappVerificationFeatureActive,
  whatsappVerifyBadgeLabel,
} from "@/lib/whatsapp-verification/profile";
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

export function WhatsAppVerifyField({
  profile,
  label = "WhatsApp / Phone Number",
  required,
  value,
  onChange,
  readOnlyInput,
  onVerified,
}: {
  profile: Profile;
  label?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  readOnlyInput?: boolean;
  onVerified?: () => void;
}) {
  const verifyActive = isWhatsappVerificationFeatureActive(profile);
  const [modalOpen, setModalOpen] = useState(false);
  const verified = isWhatsappNumberVerified(profile);
  const badge = verifyActive ? whatsappVerifyBadgeLabel(profile) : null;
  const displayPhone = value || getWhatsappNumber(profile);

  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>{label}</FieldLabel>
          {badge ? (
            <span
              className={
                verified
                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800"
                  : "rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900"
              }
            >
              {badge}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Input
            type="tel"
            inputMode="tel"
            value={value}
            onChange={(e) => onChange(normalizeNigerianPhone(e.target.value))}
            required={required}
            readOnly={readOnlyInput}
            className="h-12 flex-1 rounded-xl"
            autoComplete="tel"
          />
          {verifyActive && !verified ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 shrink-0 rounded-xl px-4"
              onClick={() => setModalOpen(true)}
            >
              Verify
            </Button>
          ) : null}
        </div>
        {verifyActive && !verified && profile.whatsapp_verification_status === "admin_required" ? (
          <p className="mt-1 text-xs text-amber-800">{WHATSAPP_VERIFY_COPY.adminRequired}</p>
        ) : null}
        {verifyActive && !verified ? (
          <p className="mt-1 text-xs text-muted">{WHATSAPP_VERIFY_COPY.profileDescription}</p>
        ) : null}
      </div>

      <WhatsAppVerificationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        phoneNumber={displayPhone}
        onVerified={onVerified}
      />
    </>
  );
}

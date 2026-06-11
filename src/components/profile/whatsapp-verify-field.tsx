"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field-label";
import { normalizeNigerianPhone } from "@/lib/phone";
import type { Profile } from "@/types/database";
import {
  getWhatsappNumber,
  isWhatsappNumberVerified,
  whatsappVerifyBadgeLabel,
} from "@/lib/whatsapp-verification/profile";
import { isWhatsappOtpEnabledClient } from "@/lib/feature-flags";
import { WhatsAppVerifyModal } from "@/components/profile/whatsapp-verify-modal";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

export function WhatsAppVerifyField({
  profile,
  label = "WhatsApp / Phone Number",
  required,
  value,
  onChange,
  readOnlyInput,
}: {
  profile: Profile;
  label?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  readOnlyInput?: boolean;
}) {
  const router = useRouter();
  const enabled = isWhatsappOtpEnabledClient();
  const [modalOpen, setModalOpen] = useState(false);
  const verified = isWhatsappNumberVerified(profile);
  const badge = whatsappVerifyBadgeLabel(profile);
  const displayPhone = value || getWhatsappNumber(profile);

  if (!enabled) {
    return (
      <div>
        <FieldLabel>{label}</FieldLabel>
        <Input
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => onChange(normalizeNigerianPhone(e.target.value))}
          required={required}
          readOnly={readOnlyInput}
          className="h-12 rounded-xl"
          autoComplete="tel"
        />
      </div>
    );
  }

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
          {!verified ? (
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
        {!verified && profile.whatsapp_verification_status === "admin_required" ? (
          <p className="mt-1 text-xs text-amber-800">{WHATSAPP_VERIFY_COPY.adminRequired}</p>
        ) : null}
      </div>

      <WhatsAppVerifyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPhone={displayPhone}
        onVerified={() => router.refresh()}
      />
    </>
  );
}

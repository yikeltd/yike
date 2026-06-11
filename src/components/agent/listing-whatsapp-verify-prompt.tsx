"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  getWhatsappNumber,
  isWhatsappNumberVerified,
  mustVerifyWhatsappBeforeListing,
} from "@/lib/whatsapp-verification/profile";
import { formatWhatsappDisplay } from "@/lib/phone";
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

export function ListingWhatsappVerifyPrompt({ profile }: { profile: Profile }) {
  const router = useRouter();
  const needsVerification =
    mustVerifyWhatsappBeforeListing(profile) && !isWhatsappNumberVerified(profile);
  const [open, setOpen] = useState(needsVerification);
  const [dismissed, setDismissed] = useState(false);

  if (!needsVerification) return null;

  const phone = getWhatsappNumber(profile);

  return (
    <>
      {!open || dismissed ? (
        <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">
          <p className="font-semibold">{WHATSAPP_VERIFY_COPY.listingPrompt}</p>
          {phone ? (
            <p className="mt-1 text-xs text-muted">{formatWhatsappDisplay(phone)}</p>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => {
              setDismissed(false);
              setOpen(true);
            }}
          >
            Verify WhatsApp
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">Verify your WhatsApp to start listing…</p>
      )}

      <WhatsAppVerificationModal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setDismissed(true);
        }}
        phoneNumber={phone}
        reason={WHATSAPP_VERIFY_COPY.listingPrompt}
        onVerified={() => router.refresh()}
      />
    </>
  );
}

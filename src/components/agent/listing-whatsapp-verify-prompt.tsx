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
import { isWhatsappOtpEnabledClient } from "@/lib/feature-flags";
import { WhatsAppVerifyModal } from "@/components/profile/whatsapp-verify-modal";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

export function ListingWhatsappVerifyPrompt({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!isWhatsappOtpEnabledClient()) return null;
  if (!mustVerifyWhatsappBeforeListing(profile)) return null;
  if (isWhatsappNumberVerified(profile)) return null;

  const phone = getWhatsappNumber(profile);

  return (
    <>
      <div className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-navy">
        <p className="font-semibold">{WHATSAPP_VERIFY_COPY.listingPrompt}</p>
        {phone ? <p className="mt-1 text-xs text-muted">{phone}</p> : null}
        <Button
          type="button"
          size="sm"
          className="mt-3"
          onClick={() => setOpen(true)}
        >
          Verify
        </Button>
      </div>

      <WhatsAppVerifyModal
        open={open}
        onClose={() => setOpen(false)}
        initialPhone={phone}
        onVerified={() => router.refresh()}
      />
    </>
  );
}

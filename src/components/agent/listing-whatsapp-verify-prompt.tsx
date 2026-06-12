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
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

export function ListingWhatsappVerifyPrompt({ profile }: { profile: Profile }) {
  const router = useRouter();
  const needsVerification =
    mustVerifyWhatsappBeforeListing(profile) && !isWhatsappNumberVerified(profile);
  const [open, setOpen] = useState(false);

  if (!needsVerification) return null;

  return (
    <>
      <div className="yike-card yike-card-compact flex items-center justify-between gap-2.5">
        <p className="text-sm font-semibold text-navy">{WHATSAPP_VERIFY_COPY.listingGate}</p>
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          {WHATSAPP_VERIFY_COPY.profileTitle}
        </Button>
      </div>

      <WhatsAppVerificationModal
        open={open}
        onOpenChange={setOpen}
        phoneNumber={getWhatsappNumber(profile)}
        onVerified={() => router.refresh()}
      />
    </>
  );
}

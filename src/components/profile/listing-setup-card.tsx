"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";
import { hasBasicListingProfile } from "@/lib/profile/basic-listing-profile";
import {
  getWhatsappNumber,
  isWhatsappNumberVerified,
  isWhatsappVerificationFeatureActive,
} from "@/lib/whatsapp-verification/profile";
import { formatWhatsappDisplay } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { WhatsAppVerificationModal } from "@/components/profile/whatsapp-verify-modal";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

type SetupRow = {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
  action?: { label: string; href?: string; onClick?: () => void };
};

function RowIcon({ done }: { done: boolean }) {
  return done ? (
    <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
  ) : (
    <Circle className="h-4 w-4 text-muted" />
  );
}

export function ListingSetupCard({
  profile,
  onVerified,
}: {
  profile: Profile;
  onVerified?: () => void;
}) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const whatsappFeature = isWhatsappVerificationFeatureActive(profile);
  const phone = getWhatsappNumber(profile);

  const rows: SetupRow[] = [
    {
      id: "email",
      label: "Email verified",
      done: Boolean(profile.email_verified),
      action: profile.email_verified
        ? undefined
        : { label: "Verify email", href: "/auth/verify-email" },
    },
    {
      id: "profile",
      label: "Personal details",
      detail: "Name, address, and date of birth",
      done: hasBasicListingProfile(profile),
      action: hasBasicListingProfile(profile)
        ? undefined
        : { label: "Complete profile", href: "/agent/profile-setup" },
    },
  ];

  if (whatsappFeature) {
    rows.push({
      id: "whatsapp",
      label: "WhatsApp number verified",
      detail: phone ? formatWhatsappDisplay(phone) : "Add your WhatsApp number",
      done: isWhatsappNumberVerified(profile),
      action: isWhatsappNumberVerified(profile)
        ? undefined
        : {
            label: phone ? "Verify" : "Add & verify",
            href: phone ? undefined : "/agent/profile-setup",
            onClick: phone ? () => setWhatsappOpen(true) : undefined,
          },
    });
  }

  const doneCount = rows.filter((r) => r.done).length;
  const allDone = doneCount === rows.length;

  return (
    <section className="rounded-2xl border border-border bg-elevated shadow-float">
      <div className="border-b border-border px-4 py-3.5">
        <p className="text-sm font-bold text-navy">Listing setup</p>
        <p className="mt-0.5 text-xs text-muted">
          {allDone
            ? "You can post listings on Yike."
            : "Complete these steps to post properties — not the same as the verified agent badge."}
        </p>
      </div>

      <ul className="divide-y divide-border px-4">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5">
              <RowIcon done={row.done} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  row.done ? "text-muted line-through decoration-muted/40" : "text-navy"
                )}
              >
                {row.label}
              </p>
              {row.detail ? (
                <p className="mt-0.5 text-xs text-muted">{row.detail}</p>
              ) : null}
            </div>
            {!row.done && row.action ? (
              row.action.href ? (
                <Link
                  href={row.action.href}
                  className="shrink-0 text-xs font-bold text-gold-dark hover:underline"
                >
                  {row.action.label}
                </Link>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-lg px-3 text-xs"
                  onClick={row.action.onClick}
                >
                  {row.action.label}
                </Button>
              )
            ) : null}
          </li>
        ))}
      </ul>

      <WhatsAppVerificationModal
        open={whatsappOpen}
        onOpenChange={setWhatsappOpen}
        phoneNumber={phone}
        reason={WHATSAPP_VERIFY_COPY.listingPrompt}
        onVerified={onVerified}
      />
    </section>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSensitiveConfirm } from "@/components/auth/sensitive-confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRequestPhoneOtp,
  normalizeNigerianPhone,
} from "@/lib/phone";

type Props = {
  userId: string;
  phone: string | null;
  whatsapp: string | null;
  phoneVerified: boolean;
};

/** Compact WhatsApp capture for trust center — no standalone card. */
export function OptionalWhatsAppInline({
  userId,
  phone,
  whatsapp,
  phoneVerified,
}: Props) {
  const { confirmSensitiveAction, sensitiveConfirmModal } = useSensitiveConfirm();
  const existing = whatsapp || phone;
  const [value, setValue] = useState(existing ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (phoneVerified || existing) return null;

  async function saveNumber() {
    const normalized = normalizeNigerianPhone(value);
    if (!canRequestPhoneOtp(normalized)) {
      setError("Enter a valid Nigerian mobile number (e.g. 08012345678)");
      return;
    }

    const confirmed = await confirmSensitiveAction("change_phone");
    if (!confirmed.ok) return;

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ phone: normalized, whatsapp: normalized })
      .eq("id", userId);
    setSaving(false);
    if (updateError) {
      setError("Could not save your number. Try again shortly.");
      return;
    }
    setSaved(true);
  }

  return (
    <>
      {sensitiveConfirmModal}
      <div className="mt-3 rounded-xl bg-surface px-3 py-3">
        {saved ? (
          <p className="text-xs font-medium text-emerald-700">
            WhatsApp connected — you&apos;re good to go.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">Add your WhatsApp number</p>
            <div className="mt-2 flex gap-2">
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="08012345678"
                value={value}
                onChange={(e) => setValue(normalizeNigerianPhone(e.target.value))}
                maxLength={11}
                className="h-10 flex-1 rounded-xl"
                autoComplete="tel"
              />
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void saveNumber()}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
            {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
          </>
        )}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSensitiveConfirm } from "@/components/auth/sensitive-confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRequestPhoneOtp,
  normalizeNigerianPhone,
} from "@/lib/phone";
import { isPhoneOtpEnabledClient } from "@/lib/feature-flags";

const DISMISS_KEY = "yike_whatsapp_prompt_dismissed";

type Props = {
  userId: string;
  phone: string | null;
  whatsapp: string | null;
  phoneVerified: boolean;
};

export function OptionalWhatsAppCard({
  userId,
  phone,
  whatsapp,
  phoneVerified,
}: Props) {
  const { confirmSensitiveAction, sensitiveConfirmModal } = useSensitiveConfirm();
  const existing = whatsapp || phone;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISS_KEY) === "1";
  });
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(existing ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (phoneVerified || existing || dismissed) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

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
    setOpen(false);
  }

  return (
    <>
      {sensitiveConfirmModal}
      <section className="rounded-2xl border border-navy/10 bg-white p-4 shadow-float">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-navy">Add your WhatsApp number</p>
            <p className="mt-1 text-sm text-muted">
              Add your WhatsApp number to chat faster with agents.
            </p>
            {saved ? (
              <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Number saved — agents can reach you on WhatsApp.
              </p>
            ) : open ? (
              <div className="mt-3 space-y-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="08012345678"
                  value={value}
                  onChange={(e) => setValue(normalizeNigerianPhone(e.target.value))}
                  maxLength={11}
                  className="h-11 rounded-xl"
                  autoComplete="tel"
                />
                {error && (
                  <p className="text-xs text-danger">{error}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" disabled={saving} onClick={() => void saveNumber()}>
                    {saving ? "Saving…" : "Save number"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
                {isPhoneOtpEnabledClient() && (
                  <p className="text-xs text-muted">Phone verification coming soon.</p>
                )}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => setOpen(true)}>
                  Add WhatsApp number
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
                  Skip for now
                </Button>
              </div>
            )}
          </div>
          {!open && (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg p-1 text-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>
    </>
  );
}

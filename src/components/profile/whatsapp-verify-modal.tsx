"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRequestPhoneOtp,
  formatWhatsappDisplay,
  normalizeWhatsappInput,
} from "@/lib/phone";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";

type Step = "intro" | "update" | "code";

export type WhatsAppVerificationModalProps = {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  initialPhone?: string;
  phoneNumber?: string;
  onVerified?: () => void;
  onNumberUpdated?: (phone: string) => void;
};

export function WhatsAppVerificationModal({
  open,
  onClose,
  onOpenChange,
  initialPhone,
  phoneNumber,
  onVerified,
  onNumberUpdated,
}: WhatsAppVerificationModalProps) {
  const resolvedPhone = phoneNumber ?? initialPhone ?? "";
  const [step, setStep] = useState<Step>("intro");
  const [phone, setPhone] = useState(resolvedPhone);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setOpen = (next: boolean) => {
    if (!next) onClose?.();
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (open) {
      setPhone(resolvedPhone);
      setStep("intro");
      setCode("");
      setError("");
    }
  }, [open, resolvedPhone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, loading]);

  if (!open) return null;

  async function sendCode(phoneValue: string) {
    const normalized = normalizeWhatsappInput(phoneValue);
    if (!canRequestPhoneOtp(normalized)) {
      setError("Enter a valid Nigerian number (e.g. 08035143299 or +2348035143299).");
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/profile/whatsapp/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalized }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      const message = (data.error as string) || WHATSAPP_VERIFY_COPY.providerUnavailable;
      setError(
        step === "update"
          ? message.includes("update") || message.includes("Could not")
            ? message
            : "Could not update number. Please try again."
          : message
      );
      return;
    }

    setPhone(normalized);
    onNumberUpdated?.(normalized);
    setStep("code");
  }

  async function verifyCode() {
    if (code.trim().length < 4) {
      setError(WHATSAPP_VERIFY_COPY.invalidCode);
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/profile/whatsapp/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError((data.error as string) || WHATSAPP_VERIFY_COPY.invalidCode);
      return;
    }

    onVerified?.();
    setOpen(false);
  }

  const displayNumber = formatWhatsappDisplay(phone || resolvedPhone);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-verify-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-elevated p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="wa-verify-title" className="text-lg font-bold text-navy">
              {WHATSAPP_VERIFY_COPY.modalTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">{WHATSAPP_VERIFY_COPY.modalBody}</p>
            <p className="mt-1.5 text-[11px] text-muted/80">
              {WHATSAPP_VERIFY_COPY.modalHelper}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "intro" && (
          <div className="mt-4 space-y-3">
            {displayNumber !== "—" ? (
              <p className="text-sm font-semibold text-foreground">{displayNumber}</p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={() => void sendCode(phone || resolvedPhone)}
            >
              {loading ? "Sending…" : WHATSAPP_VERIFY_COPY.sendCodeButton}
            </Button>
            <button
              type="button"
              className="text-xs font-semibold text-navy underline"
              onClick={() => setStep("update")}
            >
              {WHATSAPP_VERIFY_COPY.notYourNumber}{" "}
              <span className="text-gold-dark">{WHATSAPP_VERIFY_COPY.updateHere}</span>
            </button>
          </div>
        )}

        {step === "update" && (
          <div className="mt-4 space-y-3">
            <label className="text-xs font-semibold text-navy">WhatsApp number</label>
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08035143299 or +2348035143299"
              className="h-11 rounded-xl"
              autoComplete="tel"
            />
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={() => void sendCode(phone)}
            >
              {loading ? "Sending…" : WHATSAPP_VERIFY_COPY.sendCodeButton}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="mt-4 space-y-3">
            <Input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="6-digit code"
              className="h-11 rounded-xl text-center tracking-widest"
              autoComplete="one-time-code"
            />
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={() => void verifyCode()}
            >
              {loading ? "Verifying…" : WHATSAPP_VERIFY_COPY.verifyButton}
            </Button>
            <button
              type="button"
              className="w-full text-xs font-semibold text-navy underline"
              disabled={loading}
              onClick={() => void sendCode(phone)}
            >
              {WHATSAPP_VERIFY_COPY.resendCode}
            </button>
          </div>
        )}

        {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

/** @deprecated use WhatsAppVerificationModal */
export const WhatsAppVerifyModal = WhatsAppVerificationModal;

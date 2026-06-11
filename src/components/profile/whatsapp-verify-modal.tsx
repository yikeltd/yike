"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canRequestPhoneOtp, normalizeNigerianPhone } from "@/lib/phone";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
import { cn } from "@/lib/utils";

type Step = "intro" | "update" | "code";

export function WhatsAppVerifyModal({
  open,
  onClose,
  initialPhone,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  initialPhone: string;
  onVerified?: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (open) {
      setPhone(initialPhone);
      setStep("intro");
      setCode("");
      setError("");
      setInfo("");
    }
  }, [open, initialPhone]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  async function sendCode(phoneValue: string) {
    const normalized = normalizeNigerianPhone(phoneValue);
    if (!canRequestPhoneOtp(normalized)) {
      setError("Enter a valid Nigerian number (e.g. 08035143299).");
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
      setError((data.error as string) || WHATSAPP_VERIFY_COPY.providerUnavailable);
      return;
    }

    setPhone(normalized);
    setInfo(WHATSAPP_VERIFY_COPY.afterSend);
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
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-verify-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-elevated p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="wa-verify-title" className="text-lg font-bold text-navy">
              {WHATSAPP_VERIFY_COPY.modalTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">{WHATSAPP_VERIFY_COPY.modalBody}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "intro" && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-muted">{WHATSAPP_VERIFY_COPY.beforeSend}</p>
            {phone ? (
              <p className="text-sm font-medium text-foreground">{phone}</p>
            ) : null}
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={() => void sendCode(phone)}
            >
              {loading ? "Sending…" : WHATSAPP_VERIFY_COPY.primaryButton}
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
            <label className="text-xs font-semibold text-navy">WhatsApp Number</label>
            <Input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(normalizeNigerianPhone(e.target.value))}
              placeholder="08035143299"
              maxLength={11}
              className="h-11 rounded-xl"
              autoComplete="tel"
            />
            <Button
              type="button"
              className="w-full"
              disabled={loading}
              onClick={() => void sendCode(phone)}
            >
              {loading ? "Sending…" : WHATSAPP_VERIFY_COPY.verifyNumber}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="mt-4 space-y-3">
            {info ? <p className="text-xs text-muted">{info}</p> : null}
            <p className="text-xs text-muted">{WHATSAPP_VERIFY_COPY.senderHelper}</p>
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
              {loading ? "Verifying…" : WHATSAPP_VERIFY_COPY.verifyNumber}
            </Button>
            <button
              type="button"
              className={cn("text-xs font-semibold text-navy underline")}
              disabled={loading}
              onClick={() => void sendCode(phone)}
            >
              Resend code
            </button>
          </div>
        )}

        {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

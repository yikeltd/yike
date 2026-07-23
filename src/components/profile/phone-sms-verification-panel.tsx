"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRequestPhoneOtp,
  formatWhatsappDisplay,
  normalizeWhatsappInput,
} from "@/lib/phone";
import { PHONE_VERIFY_COPY } from "@/lib/phone-verification/copy";

type Step = "intro" | "update" | "code";

const RESEND_COOLDOWN_SEC = 60;

export type PhoneSmsVerificationPanelProps = {
  phoneNumber?: string;
  onVerified?: () => void;
  onNumberUpdated?: (phone: string) => void;
  /** Compact card mode vs full page panel. */
  compact?: boolean;
};

export function PhoneSmsVerificationPanel({
  phoneNumber = "",
  onVerified,
  onNumberUpdated,
  compact = false,
}: PhoneSmsVerificationPanelProps) {
  const [step, setStep] = useState<Step>(phoneNumber ? "intro" : "update");
  const [phone, setPhone] = useState(phoneNumber);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setPhone(phoneNumber);
    if (phoneNumber) setStep("intro");
  }, [phoneNumber]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function sendCode(phoneValue: string) {
    const normalized = normalizeWhatsappInput(phoneValue);
    if (!canRequestPhoneOtp(normalized)) {
      setError(PHONE_VERIFY_COPY.invalidPhone);
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/profile/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalized }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError((data.error as string) || PHONE_VERIFY_COPY.providerUnavailable);
      return;
    }

    setPhone(normalized);
    onNumberUpdated?.(normalized);
    setStep("code");
    setCooldown(RESEND_COOLDOWN_SEC);
  }

  async function verifyCode() {
    if (code.trim().length !== 6) {
      setError(PHONE_VERIFY_COPY.invalidCode);
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/profile/phone/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError((data.error as string) || PHONE_VERIFY_COPY.invalidCode);
      return;
    }

    onVerified?.();
  }

  const displayNumber = formatWhatsappDisplay(phone || phoneNumber);
  const shellClass = compact
    ? "rounded-2xl border border-border bg-elevated p-4"
    : "space-y-4";

  return (
    <div className={shellClass}>
      {!compact ? null : (
        <div className="mb-3">
          <h2 className="text-base font-bold text-navy">{PHONE_VERIFY_COPY.cardTitle}</h2>
          <p className="mt-1 text-sm text-muted">{PHONE_VERIFY_COPY.screenBody}</p>
        </div>
      )}

      {step === "intro" && (
        <div className="space-y-3">
          {displayNumber !== "—" ? (
            <p className="text-sm font-semibold tracking-wide text-foreground">
              {displayNumber}
            </p>
          ) : null}
          <p className="text-xs text-muted">{PHONE_VERIFY_COPY.validityHint}</p>
          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={() => void sendCode(phone || phoneNumber)}
          >
            {loading ? PHONE_VERIFY_COPY.sending : PHONE_VERIFY_COPY.sendButton}
          </Button>
          <button
            type="button"
            className="text-xs font-semibold text-navy underline"
            onClick={() => setStep("update")}
          >
            {PHONE_VERIFY_COPY.updateNumber}{" "}
            <span className="text-gold-dark">{PHONE_VERIFY_COPY.updateHere}</span>
          </button>
        </div>
      )}

      {step === "update" && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-navy">
            {PHONE_VERIFY_COPY.phoneLabel}
          </label>
          <Input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08103514329 or +2348103514329"
            className="h-11 rounded-xl"
            autoComplete="tel"
          />
          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={() => void sendCode(phone)}
          >
            {loading ? PHONE_VERIFY_COPY.sending : PHONE_VERIFY_COPY.sendButton}
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-wide text-foreground">
            {displayNumber}
          </p>
          <p className="text-xs text-muted">{PHONE_VERIFY_COPY.sentSms}</p>
          <p className="text-xs text-muted">{PHONE_VERIFY_COPY.validityHint}</p>
          <label className="sr-only" htmlFor="phone-sms-otp">
            {PHONE_VERIFY_COPY.codeLabel}
          </label>
          <Input
            id="phone-sms-otp"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={PHONE_VERIFY_COPY.codePlaceholder}
            className="h-12 rounded-xl text-center text-lg tracking-[0.35em]"
            autoComplete="one-time-code"
            maxLength={6}
          />
          <Button
            type="button"
            className="w-full"
            disabled={loading || code.trim().length !== 6}
            onClick={() => void verifyCode()}
          >
            {loading ? PHONE_VERIFY_COPY.verifying : PHONE_VERIFY_COPY.verifyButton}
          </Button>
          <button
            type="button"
            className="w-full text-xs font-semibold text-navy underline disabled:opacity-50"
            disabled={loading || cooldown > 0}
            onClick={() => void sendCode(phone)}
          >
            {cooldown > 0
              ? PHONE_VERIFY_COPY.resendCooldown(cooldown)
              : PHONE_VERIFY_COPY.resendButton}
          </button>
        </div>
      )}

      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
    </div>
  );
}

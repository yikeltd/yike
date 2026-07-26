"use client";

import { useEffect, useRef, useState } from "react";
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
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const sendLockRef = useRef(false);
  const verifyLockRef = useRef(false);

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
    if (sendLockRef.current || sending || verifying || cooldown > 0) return;
    const normalized = normalizeWhatsappInput(phoneValue);
    if (!canRequestPhoneOtp(normalized)) {
      setError(PHONE_VERIFY_COPY.invalidPhone);
      return;
    }

    sendLockRef.current = true;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/profile/phone/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data.error as string) || PHONE_VERIFY_COPY.providerUnavailable);
        return;
      }

      setPhone(normalized);
      onNumberUpdated?.(normalized);
      setStep("code");
      setCode("");
      setCooldown(RESEND_COOLDOWN_SEC);
    } finally {
      setSending(false);
      sendLockRef.current = false;
    }
  }

  async function verifyCode() {
    if (verifyLockRef.current || verifying || sending) return;
    if (code.trim().length !== 6) {
      setError(PHONE_VERIFY_COPY.invalidCode);
      return;
    }

    verifyLockRef.current = true;
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/profile/phone/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data.error as string) || PHONE_VERIFY_COPY.invalidCode);
        return;
      }

      onVerified?.();
    } finally {
      setVerifying(false);
      verifyLockRef.current = false;
    }
  }

  const displayNumber = formatWhatsappDisplay(phone || phoneNumber);
  const shellClass = compact
    ? "rounded-2xl border border-border bg-elevated p-4"
    : "space-y-4";
  const sendBusy = sending || cooldown > 0 || verifying;
  const verifyBusy = verifying || sending;

  return (
    <div className={shellClass}>
      {!compact ? null : (
        <div className="mb-3">
          <h2 className="text-base font-bold text-navy">{PHONE_VERIFY_COPY.cardTitle}</h2>
        </div>
      )}

      {step === "intro" && (
        <div className="space-y-3">
          {displayNumber !== "—" ? (
            <p className="text-sm font-semibold tracking-wide text-foreground">
              {displayNumber}
            </p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            disabled={sendBusy}
            onClick={() => void sendCode(phone || phoneNumber)}
          >
            {sending ? PHONE_VERIFY_COPY.sending : PHONE_VERIFY_COPY.sendButton}
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
            className="h-11 rounded-xl"
            autoComplete="tel"
            disabled={sending}
          />
          <Button
            type="button"
            className="w-full"
            disabled={sendBusy}
            onClick={() => void sendCode(phone)}
          >
            {sending ? PHONE_VERIFY_COPY.sending : PHONE_VERIFY_COPY.sendButton}
          </Button>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-wide text-foreground">
            {displayNumber}
          </p>
          <label className="sr-only" htmlFor="phone-sms-otp">
            {PHONE_VERIFY_COPY.codeLabel}
          </label>
          <Input
            id="phone-sms-otp"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="h-12 rounded-xl text-center text-lg tracking-[0.35em]"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={verifying}
          />
          <Button
            type="button"
            className="w-full"
            disabled={verifyBusy || code.trim().length !== 6}
            onClick={() => void verifyCode()}
          >
            {verifying ? PHONE_VERIFY_COPY.verifying : PHONE_VERIFY_COPY.verifyButton}
          </Button>
          <button
            type="button"
            className="w-full text-xs font-semibold text-navy underline disabled:opacity-50"
            disabled={sendBusy}
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

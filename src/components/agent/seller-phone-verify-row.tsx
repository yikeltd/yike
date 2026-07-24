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
import { CheckCircle2 } from "lucide-react";

const RESEND_COOLDOWN_SEC = 60;

export function SellerPhoneVerifyRow({
  phoneNumber = "",
  verified,
  verifiedAt,
  onVerified,
}: {
  phoneNumber?: string;
  verified: boolean;
  verifiedAt?: string | null;
  onVerified: (phone: string, verifiedAt: string) => void;
}) {
  const [phone, setPhone] = useState(phoneNumber);
  const [code, setCode] = useState("");
  const [codeVisible, setCodeVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const sendLockRef = useRef(false);
  const verifyLockRef = useRef(false);

  useEffect(() => {
    setPhone(phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    if (sendLockRef.current || loading || cooldown > 0) return;
    const normalized = normalizeWhatsappInput(phone);
    if (!canRequestPhoneOtp(normalized)) {
      setError(PHONE_VERIFY_COPY.invalidPhone);
      return;
    }
    sendLockRef.current = true;
    setLoading(true);
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
      setCodeVisible(true);
      setCooldown(RESEND_COOLDOWN_SEC);
    } finally {
      setLoading(false);
      sendLockRef.current = false;
    }
  }

  async function verifyCode() {
    if (verifyLockRef.current || loading) return;
    if (code.trim().length !== 6) {
      setError(PHONE_VERIFY_COPY.invalidCode);
      return;
    }
    verifyLockRef.current = true;
    setLoading(true);
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
      setCodeVisible(false);
      setCode("");
      const verifiedAt =
        typeof data.phoneVerifiedAt === "string"
          ? data.phoneVerifiedAt
          : new Date().toISOString();
      const verifiedPhone =
        typeof data.phone === "string" && data.phone ? data.phone : phone;
      onVerified(verifiedPhone, verifiedAt);
    } finally {
      setLoading(false);
      verifyLockRef.current = false;
    }
  }

  if (verified) {
    const stamp = verifiedAt
      ? new Date(verifiedAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="h-4 w-4" />
          Phone Number Verified
        </p>
        <p className="mt-0.5 text-xs text-emerald-800/80">
          {formatWhatsappDisplay(phone || phoneNumber)}
          {stamp ? ` · ${stamp}` : ""}
        </p>
      </div>
    );
  }

  const sendBusy = loading || sendLockRef.current || cooldown > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs font-semibold text-navy">
          Phone
          <Input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 h-11 rounded-xl"
            autoComplete="tel"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 rounded-xl border-gold/40 px-4 font-semibold text-navy"
          disabled={loading || sendLockRef.current}
          onClick={() => void sendCode()}
        >
          {loading && !codeVisible ? PHONE_VERIFY_COPY.sending : "Verify"}
        </Button>
      </div>

      {codeVisible ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-navy">
            Verification Code
            <Input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 h-11 rounded-xl tracking-[0.25em]"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </label>
          <Button
            type="button"
            className="h-11 shrink-0 rounded-xl px-4 font-semibold"
            disabled={loading || code.trim().length !== 6}
            onClick={() => void verifyCode()}
          >
            {loading ? PHONE_VERIFY_COPY.verifying : "Verify Code"}
          </Button>
        </div>
      ) : null}

      {codeVisible ? (
        <button
          type="button"
          className="text-xs font-semibold text-navy underline disabled:opacity-50"
          disabled={sendBusy}
          onClick={() => void sendCode()}
        >
          {cooldown > 0
            ? PHONE_VERIFY_COPY.resendCooldown(cooldown)
            : PHONE_VERIFY_COPY.resendButton}
        </button>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

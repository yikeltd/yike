"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN_SEC = 60;

export type EmailOtpPurpose = "signup" | "login" | "email_verify" | "password_reset";
export type EmailOtpVerifyResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  userId?: string;
  profile?: unknown;
  deviceTrusted?: boolean;
  requiresPinSetup?: boolean;
};

export function EmailOtpModal({
  open,
  email,
  fullName,
  purpose = "signup",
  password,
  onClose,
  onVerified,
  autoSend = true,
  initialCodeSent = false,
  redirecting = false,
}: {
  open: boolean;
  email: string;
  fullName?: string;
  purpose?: EmailOtpPurpose;
  password?: string;
  redirecting?: boolean;
  onClose?: () => void;
  onVerified: (data: EmailOtpVerifyResponse) => void | Promise<void>;
  autoSend?: boolean;
  initialCodeSent?: boolean;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const sendCode = useCallback(async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, purpose }),
      });
      const data = (await res.json()) as EmailOtpVerifyResponse;
      if (!res.ok) {
        setError(data.error ?? EMAIL_OTP_USER_MESSAGES.sendFailed);
        setCodeSent(false);
        return;
      }
      setCodeSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
    } catch {
      setError(EMAIL_OTP_USER_MESSAGES.network);
    } finally {
      setSending(false);
    }
  }, [email, fullName, purpose]);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setError("");
    setSuccess("");
    if (initialCodeSent) {
      setCodeSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
      return;
    }
    setCodeSent(false);
    if (autoSend) void sendCode();
  }, [open, autoSend, initialCodeSent, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function verifyOtp(otp: string) {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          purpose,
          ...(purpose === "signup" && password ? { password } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? EMAIL_OTP_USER_MESSAGES.incorrect);
        setCode("");
        return;
      }
      setSuccess(data.message ?? EMAIL_OTP_USER_MESSAGES.verified);
      await new Promise((r) => window.setTimeout(r, 400));
      await onVerified(data);
    } catch {
      setError(EMAIL_OTP_USER_MESSAGES.network);
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-otp-title"
        className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-elevated p-6 shadow-float-lg sm:m-4 sm:rounded-3xl"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <h2 id="email-otp-title" className="pr-8 text-xl font-bold text-foreground">
          Verify your email
        </h2>
        <p className="mt-1 text-sm text-muted">
          {codeSent ? (
            <>
              Code sent to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
            </>
          ) : sending ? (
            <>Sending your code to {email}…</>
          ) : (
            <>
              We&apos;ll send a 6-digit code to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
            </>
          )}
        </p>

        {codeSent && !error && !success && (
          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Check your inbox — code expires in 10 minutes.
          </p>
        )}

        <div className="mt-6">
          <OtpCodeInput
            value={code}
            onChange={setCode}
            onComplete={(otp) => void verifyOtp(otp)}
            disabled={verifying || Boolean(success)}
          />
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {redirecting ? "Taking you to your dashboard…" : success}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            fullWidth
            size="lg"
            disabled={verifying || code.length !== 6 || Boolean(success)}
            onClick={() => void verifyOtp(code)}
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify email"
            )}
          </Button>
          <button
            type="button"
            disabled={sending || cooldown > 0}
            onClick={() => void sendCode()}
            className={cn(
              "py-2 text-center text-sm font-semibold transition-colors",
              cooldown > 0 || sending
                ? "text-muted"
                : "text-gold-dark hover:underline dark:text-gold"
            )}
          >
            {sending
              ? "Sending…"
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}

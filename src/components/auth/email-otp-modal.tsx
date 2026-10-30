"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { EMAIL_OTP_USER_MESSAGES } from "@/lib/notifications/messages";
import { fetchAuthJson, shouldApplyAsyncResult } from "@/lib/auth/auth-fetch";
import {
  EMAIL_OTP_EXPIRY_MINUTES,
  EMAIL_OTP_RESEND_COOLDOWN_SEC,
  emailOtpResendLabel,
  resolveEmailOtpDispatchPresentation,
  resolveEmailOtpSendFailure,
  resolveEmailOtpVerifyFailure,
  shouldAutoSendEmailOtpOnOpen,
  type EmailOtpDispatchStatus,
} from "@/lib/auth/email-otp-flow";
import { cn } from "@/lib/utils";

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
  initialDispatchStatus,
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
  initialDispatchStatus?: EmailOtpDispatchStatus;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hourlyCap, setHourlyCap] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<EmailOtpDispatchStatus>(
    "provider_accepted"
  );
  const [showInboxInstructions, setShowInboxInstructions] = useState(true);

  const openSessionRef = useRef(0);
  const lastAutoSendSessionRef = useRef(0);
  const sendGenerationRef = useRef(0);
  const verifyGenerationRef = useRef(0);
  const sendInFlightRef = useRef(false);
  const cooldownRef = useRef(0);
  const hourlyCapRef = useRef(false);
  const sendCodeRef = useRef<((options?: { force?: boolean }) => Promise<void>) | null>(
    null
  );

  useEffect(() => {
    cooldownRef.current = cooldown;
  }, [cooldown]);

  useEffect(() => {
    hourlyCapRef.current = hourlyCap;
  }, [hourlyCap]);

  const emailRef = useRef(email);
  const fullNameRef = useRef(fullName);
  const purposeRef = useRef(purpose);

  useEffect(() => {
    emailRef.current = email;
    fullNameRef.current = fullName;
    purposeRef.current = purpose;
  }, [email, fullName, purpose]);

  const sendCode = useCallback(async (options?: { force?: boolean }) => {
    if (sendInFlightRef.current) return;
    if (hourlyCapRef.current) return;
    if (!options?.force && cooldownRef.current > 0) return;

    sendInFlightRef.current = true;
    const generation = ++sendGenerationRef.current;
    setSending(true);
    setError("");
    setInfo("");

    const result = await fetchAuthJson<{
      error?: string;
      message?: string;
      dispatchStatus?: EmailOtpDispatchStatus;
      retryAfterSec?: number;
      limitReason?: string;
    }>("/api/auth/send-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailRef.current,
        fullName: fullNameRef.current,
        purpose: purposeRef.current,
      }),
    });

    if (!shouldApplyAsyncResult(generation, sendGenerationRef.current)) {
      sendInFlightRef.current = false;
      return;
    }

    setSending(false);
    sendInFlightRef.current = false;

    if (!result.ok) {
      const resolved = resolveEmailOtpSendFailure({
        kind: result.kind,
        status: result.status,
        message: result.message,
        data: result.data,
      });
      setError(resolved.userMessage);
      setCooldown(resolved.resendCooldownSec);
      setHourlyCap(resolved.isHourlyCap);
      if (resolved.treatAsCodeSent) {
        setCodeSent(true);
      } else if (!options?.force) {
        setCodeSent(false);
      }
      return;
    }

    const presentation = resolveEmailOtpDispatchPresentation(result.data?.dispatchStatus);
    setDispatchStatus(presentation.dispatchStatus);
    setShowInboxInstructions(presentation.showInboxInstructions);
    setCodeSent(true);
    setHourlyCap(false);
    setCooldown(EMAIL_OTP_RESEND_COOLDOWN_SEC);
    setInfo(presentation.infoMessage);
    lastAutoSendSessionRef.current = openSessionRef.current;
  }, []);

  useEffect(() => {
    sendCodeRef.current = sendCode;
  }, [sendCode]);

  useEffect(() => {
    if (!open) return;

    openSessionRef.current += 1;
    setCode("");
    setError("");
    setInfo("");
    setSuccess("");
    setHourlyCap(false);

    if (initialCodeSent) {
      const presentation = resolveEmailOtpDispatchPresentation(initialDispatchStatus);
      setDispatchStatus(presentation.dispatchStatus);
      setShowInboxInstructions(presentation.showInboxInstructions);
      setCodeSent(true);
      setCooldown(EMAIL_OTP_RESEND_COOLDOWN_SEC);
      setInfo(presentation.infoMessage);
      lastAutoSendSessionRef.current = openSessionRef.current;
      return;
    }

    setCodeSent(false);
    setCooldown(0);

    if (
      shouldAutoSendEmailOtpOnOpen({
        autoSend,
        initialCodeSent,
        openSessionId: openSessionRef.current,
        lastSentOpenSessionId: lastAutoSendSessionRef.current,
      })
    ) {
      void sendCodeRef.current?.();
    }
  }, [open, autoSend, initialCodeSent, initialDispatchStatus]);

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
    if (verifying) return;
    const generation = ++verifyGenerationRef.current;
    setVerifying(true);
    setError("");
    setInfo("");

    const result = await fetchAuthJson<EmailOtpVerifyResponse>(
      "/api/auth/verify-email-otp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailRef.current,
          otp,
          purpose: purposeRef.current,
          ...(purposeRef.current === "signup" && password ? { password } : {}),
        }),
      },
      20_000
    );

    if (!shouldApplyAsyncResult(generation, verifyGenerationRef.current)) return;

    setVerifying(false);

    if (!result.ok) {
      const resolved = resolveEmailOtpVerifyFailure(
        result.message || EMAIL_OTP_USER_MESSAGES.incorrect
      );
      setError(resolved.userMessage);
      if (resolved.suggestResend) {
        setInfo(
          hourlyCap
            ? "When the hourly limit clears, use Resend code for a new one."
            : cooldown > 0
              ? `You can request a new code in ${cooldown}s.`
              : "Use Resend code below to get a new one."
        );
      }
      setCode("");
      return;
    }

    setSuccess(result.data.message ?? EMAIL_OTP_USER_MESSAGES.verified);
    await new Promise((r) => window.setTimeout(r, 400));
    await onVerified(result.data);
  }

  const resendDisabled = sending || cooldown > 0 || hourlyCap;
  const resendLabel = emailOtpResendLabel({
    sending,
    cooldownSec: cooldown,
    hourlyCap,
  });

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
            dispatchStatus === "dev_console" ? (
              <>
                Enter the 6-digit code for{" "}
                <span className="font-semibold text-foreground">{email}</span> from
                your dev server terminal.
              </>
            ) : (
              <>
                Code sent to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </>
            )
          ) : sending ? (
            <>Sending your code to {email}…</>
          ) : (
            <>
              We&apos;ll send a 6-digit code to{" "}
              <span className="font-semibold text-foreground">{email}</span>.
            </>
          )}
        </p>

        {codeSent && showInboxInstructions && !error && !success && (
          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Check your inbox — code expires in {EMAIL_OTP_EXPIRY_MINUTES} minutes.
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

        {info && !error && (
          <p className="mt-4 rounded-xl bg-gold/10 px-3 py-2 text-sm text-foreground">
            {info}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger" role="alert">
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
            disabled={resendDisabled}
            aria-disabled={resendDisabled}
            onClick={() => void sendCode({ force: true })}
            className={cn(
              "py-2 text-center text-sm font-semibold transition-colors",
              resendDisabled
                ? "text-muted"
                : "text-gold-dark hover:underline dark:text-gold"
            )}
          >
            {resendLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

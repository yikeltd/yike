"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRequestPhoneOtp,
  normalizeNigerianPhone,
} from "@/lib/phone";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type OtpChannel = "sms" | "whatsapp";

export function SignupForm({
  agentNote,
  nextPath,
}: {
  agentNote?: boolean;
  nextPath?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [codeSentFlash, setCodeSentFlash] = useState(false);
  const [codeSentMessage, setCodeSentMessage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedPhone = useMemo(() => normalizeNigerianPhone(phone), [phone]);
  const showVerifyPhone = canRequestPhoneOtp(normalizedPhone);

  useEffect(() => {
    if (!channelModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sendingOtp && !codeSentFlash) setChannelModalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [channelModalOpen, sendingOtp, codeSentFlash]);

  function openChannelModal() {
    setCodeSentFlash(false);
    setCodeSentMessage("");
    setChannelModalOpen(true);
  }

  async function sendOtp(channel: OtpChannel) {
    setSendingOtp(true);
    setError("");
    const res = await fetch("/api/auth/phone/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizedPhone, channel }),
    });
    const data = await res.json();
    setSendingOtp(false);
    if (!res.ok) {
      setError(data.error ?? "We could not send the code right now.");
      setChannelModalOpen(false);
      return;
    }
    setCodeSentMessage(
      data.message ??
        (data.channel === "whatsapp"
          ? "Verification code sent to WhatsApp."
          : "Verification code sent by SMS.")
    );
    setCodeSentFlash(true);
    setOtpSent(true);
    setPhoneVerified(false);
    setPhoneVerificationToken("");
    setOtp("");
    window.setTimeout(() => {
      setCodeSentFlash(false);
      setChannelModalOpen(false);
    }, 1200);
  }

  async function verifyOtp() {
    setVerifyingOtp(true);
    setError("");
    const res = await fetch("/api/auth/phone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizedPhone, code: otp }),
    });
    const data = await res.json();
    setVerifyingOtp(false);
    if (!res.ok) {
      setError(data.error ?? "Incorrect code");
      return;
    }
    setPhoneVerified(true);
    setPhoneVerificationToken(data.phoneVerificationToken);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneVerified || !phoneVerificationToken) {
      setError("Verify your phone number before creating an account");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        username,
        email,
        phone: normalizedPhone,
        password,
        confirmPassword,
        pin,
        phoneVerificationToken,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Could not create account");
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      router.push("/auth/verify-email");
      return;
    }

    const verifyUrl = nextPath
      ? `/auth/verify-email?next=${encodeURIComponent(nextPath)}`
      : "/auth/verify-email";
    router.push(verifyUrl);
    router.refresh();
  }

  return (
    <AuthShell
      title="Create your Yike account"
      compact
      footer={
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-gold-dark dark:text-gold">
            Sign in
          </Link>
        </p>
      }
    >
      {agentNote && (
        <p className="mb-4 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5 text-sm text-foreground">
          Agent verification after signup.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <Input
            placeholder="Obinna Adebayo Aliyu"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-12 rounded-xl"
            autoComplete="name"
          />
        </Field>

        <Field label="Username">
          <Input
            placeholder="obinna_adebayo_aliyu"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            required
            minLength={3}
            maxLength={24}
            className="h-12 rounded-xl"
            autoComplete="username"
          />
        </Field>

        <Field label="Email">
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl"
            autoComplete="email"
          />
        </Field>

        <Field label="Phone number">
          <div className="flex items-center gap-2">
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => {
                setPhone(normalizeNigerianPhone(e.target.value));
                setPhoneVerified(false);
                setOtpSent(false);
                setOtp("");
              }}
              required
              maxLength={11}
              className="h-12 min-w-0 flex-1 rounded-xl"
              autoComplete="tel"
            />
            {phoneVerified ? (
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                Verified
              </span>
            ) : showVerifyPhone ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-12 shrink-0 px-4"
                onClick={openChannelModal}
                disabled={sendingOtp}
              >
                Verify phone
              </Button>
            ) : null}
          </div>
          {otpSent && !phoneVerified && (
            <div className="mt-2 flex items-center gap-2">
              <Input
                inputMode="numeric"
                placeholder="Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="h-12 min-w-0 flex-1 rounded-xl tracking-widest"
              />
              {otp.length === 6 && (
                <Button
                  type="button"
                  size="sm"
                  className="h-12 shrink-0 px-4"
                  onClick={verifyOtp}
                  disabled={verifyingOtp}
                >
                  {verifyingOtp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              )}
            </div>
          )}
        </Field>

        <Field label="Password">
          <Input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            className="h-12 rounded-xl"
            autoComplete="new-password"
          />
        </Field>

        <Field label="Confirm password">
          <Input
            type="password"
            placeholder="••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
            className={cn(
              "h-12 rounded-xl",
              confirmPassword && confirmPassword !== password && "ring-2 ring-red-400/50"
            )}
            autoComplete="new-password"
          />
        </Field>

        <Field label="Choose PIN">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            className="h-12 rounded-xl tracking-[0.3em]"
            autoComplete="off"
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger dark:bg-red-500/15 dark:text-red-300">
            {error}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={loading || !phoneVerified}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <PhoneChannelModal
        open={channelModalOpen}
        sending={sendingOtp}
        codeSent={codeSentFlash}
        codeSentMessage={codeSentMessage}
        onClose={() => {
          if (!sendingOtp && !codeSentFlash) setChannelModalOpen(false);
        }}
        onSelect={sendOtp}
      />
    </AuthShell>
  );
}

function PhoneChannelModal({
  open,
  sending,
  codeSent,
  codeSentMessage,
  onClose,
  onSelect,
}: {
  open: boolean;
  sending: boolean;
  codeSent: boolean;
  codeSentMessage: string;
  onClose: () => void;
  onSelect: (channel: OtpChannel) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-channel-title"
        className="relative w-full max-w-xs rounded-2xl border border-border bg-card p-5 shadow-xl"
      >
        {!codeSent && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {codeSent ? (
          <p
            id="phone-channel-title"
            className="py-2 text-center text-base font-semibold text-foreground"
          >
            {codeSentMessage || "Verification code sent."}
          </p>
        ) : (
          <>
            <p
              id="phone-channel-title"
              className="mb-4 text-center text-base font-semibold text-foreground"
            >
              Receive code via
            </p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                fullWidth
                onClick={() => onSelect("whatsapp")}
                disabled={sending}
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "WhatsApp"}
              </Button>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => onSelect("sms")}
                disabled={sending}
              >
                SMS
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  canRequestPhoneOtp,
  normalizeNigerianPhone,
} from "@/lib/phone";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [confirmPin, setConfirmPin] = useState("");

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedPhone = useMemo(() => normalizeNigerianPhone(phone), [phone]);
  const showVerifyPhone = canRequestPhoneOtp(normalizedPhone);

  async function sendOtp() {
    setSendingOtp(true);
    setError("");
    const res = await fetch("/api/auth/phone/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: normalizedPhone }),
    });
    const data = await res.json();
    setSendingOtp(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send code");
      return;
    }
    setOtpSent(true);
    setPhoneVerified(false);
    setPhoneVerificationToken("");
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
      setError(data.error ?? "Invalid code");
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
    if (pin !== confirmPin) {
      setError("PINs do not match");
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
      subtitle="Post properties, save homes, and contact trusted agents."
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
          Create your account first. You&apos;ll verify as an agent before listing properties.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <Input
            placeholder="Ada Okonkwo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-12 rounded-xl"
            autoComplete="name"
          />
        </Field>

        <Field label="Username">
          <Input
            placeholder="ada_okonkwo"
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
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 rounded-xl"
            autoComplete="email"
          />
        </Field>

        <Field label="Nigerian phone number">
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
            className="h-12 rounded-xl"
            autoComplete="tel"
          />
          {phoneVerified ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Phone verified
            </p>
          ) : showVerifyPhone ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={sendOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Verify phone"
              )}
            </Button>
          ) : phone.length > 0 ? (
            <p className="mt-1.5 text-xs text-muted">
              Use 11 digits starting with 070, 080, 081, 090, or 091
            </p>
          ) : null}
        </Field>

        {otpSent && !phoneVerified && (
          <Field label="Verification code">
            <div className="flex gap-2">
              <Input
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="h-12 flex-1 rounded-xl tracking-widest"
              />
              <Button
                type="button"
                onClick={verifyOtp}
                disabled={otp.length !== 6 || verifyingOtp}
                className="shrink-0"
              >
                {verifyingOtp ? "…" : "Confirm"}
              </Button>
            </div>
            <button
              type="button"
              onClick={sendOtp}
              className="mt-2 text-xs font-semibold text-gold-dark dark:text-gold"
            >
              Resend code
            </button>
          </Field>
        )}

        <Field label="Password">
          <Input
            type="password"
            placeholder="Min. 6 characters"
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
            placeholder="Repeat password"
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

        <Field label="6-digit PIN" hint="For quick unlock on trusted devices">
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

        <Field label="Confirm PIN">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="••••••"
            value={confirmPin}
            onChange={(e) =>
              setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
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
    </AuthShell>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

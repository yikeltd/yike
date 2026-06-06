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
import {
  isStrongPassword,
  passwordChecks,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";
import { createMathChallenge } from "@/lib/signup-math-challenge";
import { CheckCircle2, Loader2, MessageSquareText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PASSWORD_PLACEHOLDER = "••••••••";

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
  const [mathChallenge] = useState(createMathChallenge);
  const [mathAnswer, setMathAnswer] = useState("");

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
  const passwordRules = useMemo(() => passwordChecks(password), [password]);
  const mathOk =
    mathAnswer.trim() !== "" &&
    Number(mathAnswer) === mathChallenge.a + mathChallenge.b;

  useEffect(() => {
    if (!channelModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sendingOtp) setChannelModalOpen(false);
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
    }, 5000);
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
    if (!isStrongPassword(password)) {
      setError("Use 8+ characters with uppercase, lowercase, and a number");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!mathOk) {
      setError("Solve the addition check below your PIN");
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
        mathA: mathChallenge.a,
        mathB: mathChallenge.b,
        mathAnswer: Number(mathAnswer),
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
            placeholder={PASSWORD_PLACEHOLDER}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
            required
            className="h-12 rounded-xl"
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted">
              <PasswordRule ok={passwordRules.minLength} label="At least 8 characters" />
              <PasswordRule ok={passwordRules.uppercase} label="One uppercase letter" />
              <PasswordRule ok={passwordRules.lowercase} label="One lowercase letter" />
              <PasswordRule ok={passwordRules.number} label="One number" />
            </ul>
          )}
        </Field>

        <Field label="Confirm password">
          <Input
            type="password"
            placeholder={PASSWORD_PLACEHOLDER}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
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

        <Field label="Security check">
          <p className="mb-2 text-xs text-muted">
            What is {mathChallenge.a} + {mathChallenge.b}?
          </p>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Your answer"
            value={mathAnswer}
            onChange={(e) => setMathAnswer(e.target.value.replace(/\D/g, "").slice(0, 3))}
            required
            className={cn(
              "h-12 rounded-xl",
              mathAnswer && !mathOk && "ring-2 ring-red-400/50"
            )}
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
          disabled={loading || !phoneVerified || !mathOk || !isStrongPassword(password)}
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
          if (sendingOtp) return;
          setCodeSentFlash(false);
          setChannelModalOpen(false);
        }}
        onSelect={sendOtp}
      />
    </AuthShell>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
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
        onClick={() => {
          if (!sending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-channel-title"
        className="relative w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-6 shadow-[0_20px_50px_rgba(3,27,78,0.18)]"
      >
        {codeSent ? (
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Code sent
            </p>
            <p
              id="phone-channel-title"
              className="mt-2 text-sm leading-relaxed text-muted"
            >
              {codeSentMessage || "Check your phone for the verification code."}
            </p>
            <p className="mt-2 text-xs text-muted">This closes automatically in a few seconds.</p>
            <Button
              type="button"
              variant="outline"
              fullWidth
              className="mt-4"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <p
              id="phone-channel-title"
              className="pr-8 text-center text-xl font-extrabold tracking-tight text-navy"
            >
              Receive code via
            </p>
            <p className="mb-5 mt-2 text-center text-sm font-medium leading-relaxed text-navy/70">
              Choose how we send your 6-digit verification code
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onSelect("whatsapp")}
                disabled={sending}
                className="pressable flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#25D366] text-base font-bold text-white shadow-[0_4px_14px_rgba(37,211,102,0.35)] transition-colors hover:bg-[#1fb855] disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <WhatsAppIcon className="h-6 w-6 shrink-0" />
                    WhatsApp
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onSelect("sms")}
                disabled={sending}
                className="pressable flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#E4B547] text-base font-bold text-[#031B4E] shadow-[0_4px_14px_rgba(228,181,71,0.4)] transition-colors hover:bg-[#d9a83a] disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-navy" />
                ) : (
                  <>
                    <MessageSquareText className="h-6 w-6 shrink-0 stroke-[2.25px]" />
                    SMS
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-1.5", ok && "text-emerald-600 dark:text-emerald-400")}>
      <span className="text-[10px]" aria-hidden>
        {ok ? "✓" : "○"}
      </span>
      {label}
    </li>
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

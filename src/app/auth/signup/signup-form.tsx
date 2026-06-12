"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailOtpModal } from "@/components/auth/email-otp-modal";
import { PasswordChecklist } from "@/components/auth/password-checklist";
import { PinChecklist } from "@/components/auth/pin-checklist";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isBasicPhoneFormat,
  normalizeNigerianPhone,
  normalizePhoneForDuplicateCheck,
} from "@/lib/phone";
import {
  isStrongPassword,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";
import { pinPolicyError } from "@/lib/pin-policy";
import { createMathChallenge } from "@/lib/signup-math-challenge";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { saveQuickLoginUser } from "@/lib/auth/quick-login";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { friendlySignupError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

const PASSWORD_PLACEHOLDER = "••••••••";

type PendingSignup = {
  email: string;
  password: string;
  fullName: string;
  username: string;
};

async function checkSignupDuplicates(email: string, phone: string) {
  const res = await fetch("/api/auth/signup/check-duplicates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, phone }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { emailExists?: boolean; phoneExists?: boolean };
}

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

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [redirectingAfterVerify, setRedirectingAfterVerify] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);
  const dupeCheckRef = useRef(0);

  const normalizedPhone = useMemo(() => {
    const intl = normalizePhoneForDuplicateCheck(phone);
    return intl ? `0${intl.slice(3)}` : normalizeNigerianPhone(phone);
  }, [phone]);
  const reviewerBypass = useMemo(
    () => isReviewerAccountEmail(email),
    [email]
  );
  const phoneValid = isBasicPhoneFormat(phone);
  const mathOk =
    mathAnswer.trim() !== "" &&
    Number(mathAnswer) === mathChallenge.a + mathChallenge.b;

  const runDuplicateCheck = useCallback(
    async (emailValue: string, phoneValue: string) => {
      const checkId = ++dupeCheckRef.current;
      const trimmedEmail = emailValue.trim().toLowerCase();
      const trimmedPhone = phoneValue.trim();

      if (trimmedEmail.includes("@")) {
        const result = await checkSignupDuplicates(trimmedEmail, "");
        if (checkId !== dupeCheckRef.current || !result) return;
        setEmailError(result.emailExists ? "Email already in use" : "");
      }

      if (trimmedPhone && isBasicPhoneFormat(trimmedPhone)) {
        const result = await checkSignupDuplicates("", trimmedPhone);
        if (checkId !== dupeCheckRef.current || !result) return;
        setPhoneError(result.phoneExists ? "Number already in use" : "");
      }
    },
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void runDuplicateCheck(email, phone);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [email, phone, runDuplicateCheck]);

  async function finishSignupSession(creds: PendingSignup) {
    setRedirectingAfterVerify(true);
    const supabase = createClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

    if (signInError) {
      setRedirectingAfterVerify(false);
      setError("Account created — sign in with your email and password.");
      return;
    }

    if (signInData.user) {
      saveQuickLoginUser({
        userId: signInData.user.id,
        email: creds.email,
        fullName: creds.fullName,
        username: creds.username,
        avatarUrl: null,
      });
    }

    const destination = nextPath ?? "/profile";
    const resumed = await resumePendingAuthIntent(router, {
      fallbackPath: destination,
      emailVerified: true,
    });
    if (!resumed) {
      router.replace(destination);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setPhoneError("");

    if (!phone.trim()) {
      setPhoneError("Enter your phone number");
      return;
    }
    if (!phoneValid) {
      setPhoneError("Enter a valid phone number");
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
    const pinError = pinPolicyError(pin);
    if (pinError) {
      setError(pinError);
      return;
    }

    const dupeResult = await checkSignupDuplicates(email, phone);
    if (dupeResult?.emailExists) {
      setEmailError("Email already in use");
      return;
    }
    if (dupeResult?.phoneExists) {
      setPhoneError("Number already in use");
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
        mathA: mathChallenge.a,
        mathB: mathChallenge.b,
        mathAnswer: Number(mathAnswer),
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      userId?: string;
      needsEmailVerification?: boolean;
      resume?: boolean;
      message?: string;
      code?: string;
      error?: string;
    };

    setLoading(false);

    if (!res.ok) {
      if (data.code === "email_exists" || data.code === "account_exists") {
        setEmailError("Email already in use");
        return;
      }
      if (data.code === "phone_exists") {
        setPhoneError("Number already in use");
        return;
      }
      if (data.code === "account_deleted") {
        setError("This account needs support review. Please contact Yike support.");
        return;
      }
      setError(friendlySignupError(data.error ?? "Could not create account"));
      return;
    }

    if (reviewerBypass && data.userId) {
      await finishSignupSession({
        email,
        password,
        fullName,
        username,
      });
      return;
    }

    if (data.needsEmailVerification) {
      setPendingSignup({
        email,
        password,
        fullName,
        username,
      });
      if (data.resume) {
        setError("");
      }
      setEmailVerifyOpen(true);
    }
  }

  const canSubmit =
    !loading &&
    mathOk &&
    phoneValid &&
    !emailError &&
    !phoneError &&
    isStrongPassword(password) &&
    password === confirmPassword;

  return (
    <>
      {!redirectingAfterVerify && (
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
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 rounded-xl"
              autoComplete="name"
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              required
              className={cn(
                "h-12 rounded-xl",
                emailError && "ring-2 ring-red-400/50"
              )}
              autoComplete="email"
            />
            {emailError ? (
              <p className="mt-1 text-xs text-danger">{emailError}</p>
            ) : null}
          </Field>

          <Field label="Username">
            <Input
              placeholder="your_username"
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

          <Field label="Phone">
            <Input
              type="tel"
              inputMode="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError("");
              }}
              required
              className={cn(
                "h-12 rounded-xl",
                phoneError && "ring-2 ring-red-400/50"
              )}
              autoComplete="tel"
            />
            {phoneError ? (
              <p className="mt-1 text-xs text-danger">{phoneError}</p>
            ) : null}
          </Field>

          <Field label="Password">
            <PasswordInput
              placeholder={PASSWORD_PLACEHOLDER}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={PASSWORD_MIN_LENGTH}
              required
              className="h-12 rounded-xl"
              autoComplete="new-password"
              revealLabel="password"
            />
            <PasswordChecklist password={password} confirmPassword={confirmPassword} />
          </Field>

          <Field label="Confirm password">
            <PasswordInput
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
              revealLabel="confirm password"
            />
          </Field>

          <Field label="Choose PIN">
            <PasswordInput
              inputMode="numeric"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              className="h-12 rounded-xl tracking-[0.3em]"
              autoComplete="off"
              revealLabel="PIN"
            />
            <PinChecklist pin={pin} />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <p className="text-sm text-muted sm:shrink-0">
              What is {mathChallenge.a} + {mathChallenge.b}?
            </p>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Your answer"
              aria-label={`Answer: ${mathChallenge.a} plus ${mathChallenge.b}`}
              value={mathAnswer}
              onChange={(e) => setMathAnswer(e.target.value.replace(/\D/g, "").slice(0, 3))}
              required
              className={cn(
                "h-12 rounded-xl sm:max-w-[9.5rem]",
                mathAnswer && !mathOk && "ring-2 ring-red-400/50"
              )}
              autoComplete="off"
            />
          </div>

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger dark:bg-red-500/15 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthShell>
      )}

      {pendingSignup && (
        <EmailOtpModal
          open={emailVerifyOpen || redirectingAfterVerify}
          email={pendingSignup.email}
          fullName={pendingSignup.fullName}
          purpose="signup"
          password={pendingSignup.password}
          autoSend={false}
          initialCodeSent
          redirecting={redirectingAfterVerify}
          onVerified={() => finishSignupSession(pendingSignup)}
        />
      )}
    </>
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

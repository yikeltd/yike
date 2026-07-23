"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailOtpModal } from "@/components/auth/email-otp-modal";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  digitsOnlyPhoneLocal,
  isLocalNigerianSignupPhone,
  normalizeNigerianPhone,
} from "@/lib/phone";
import { isValidSignupCredential } from "@/lib/password-policy";
import { PIN_LENGTH, pinPolicyError } from "@/lib/pin-policy";
import { createMathChallenge } from "@/lib/signup-math-challenge";
import { isReviewerAccountEmail } from "@/lib/reviewer-accounts";
import { saveQuickLoginUser } from "@/lib/auth/quick-login";
import { resumePendingAuthIntent } from "@/lib/resume-auth-intent";
import { friendlySignupError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

const PHONE_ERROR = "Enter a valid 11-digit Nigerian phone number.";

type PendingSignup = {
  email: string;
  password: string;
  fullName: string;
  username: string;
};

function digitsOnly(value: string, max = PIN_LENGTH) {
  return value.replace(/\D/g, "").slice(0, max);
}

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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [mathChallenge] = useState(createMathChallenge);
  const [mathAnswer, setMathAnswer] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pinError, setPinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailVerifyOpen, setEmailVerifyOpen] = useState(false);
  const [redirectingAfterVerify, setRedirectingAfterVerify] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);
  const dupeCheckRef = useRef(0);
  const confirmPinRef = useRef<HTMLInputElement | null>(null);

  const normalizedPhone = useMemo(
    () => (isLocalNigerianSignupPhone(phone) ? normalizeNigerianPhone(phone) : ""),
    [phone]
  );
  const reviewerBypass = useMemo(
    () => isReviewerAccountEmail(email),
    [email]
  );
  const phoneValid = isLocalNigerianSignupPhone(phone);
  const showPinHelper = pin.length > 0 && pin.length < PIN_LENGTH;
  const mathOk =
    mathAnswer.trim() !== "" &&
    Number(mathAnswer) === mathChallenge.a + mathChallenge.b;
  const pinsMatch = pin.length === PIN_LENGTH && pin === confirmPin;
  const pinValid = isValidSignupCredential(pin);

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

      if (trimmedPhone && isLocalNigerianSignupPhone(trimmedPhone)) {
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

  function validatePhoneField(value: string): string {
    if (!value) return "Enter your phone number";
    if (!isLocalNigerianSignupPhone(value)) return PHONE_ERROR;
    return "";
  }

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
      setError("Account created — sign in with your email and PIN.");
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
    setPinError("");

    if (!fullName.trim()) {
      setError("Enter your full name");
      return;
    }
    const phoneFieldError = validatePhoneField(phone);
    if (phoneFieldError) {
      setPhoneError(phoneFieldError);
      return;
    }
    setPhoneError("");
    const policyError = pinPolicyError(pin);
    if (policyError) {
      setPinError(policyError);
      setError(policyError);
      return;
    }
    if (pin !== confirmPin) {
      setPinError("PINs do not match");
      setError("PINs do not match");
      return;
    }
    if (!mathOk) {
      setError("Solve the addition check below");
      return;
    }
    if (!acceptedTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
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

    // PIN is the Auth password — same value hashed by Supabase + profile pin_hash.
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone: normalizedPhone,
        password: pin,
        confirmPassword: confirmPin,
        pin,
        acceptedTerms: true,
        mathA: mathChallenge.a,
        mathB: mathChallenge.b,
        mathAnswer: Number(mathAnswer),
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      userId?: string;
      username?: string;
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

    const username = data.username ?? "";

    if (reviewerBypass && data.userId) {
      await finishSignupSession({
        email,
        password: pin,
        fullName,
        username,
      });
      return;
    }

    if (data.needsEmailVerification) {
      setPendingSignup({
        email,
        password: pin,
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
    acceptedTerms &&
    mathOk &&
    phoneValid &&
    fullName.trim().length > 0 &&
    email.trim().includes("@") &&
    !emailError &&
    !phoneError &&
    pinValid &&
    pinsMatch;

  return (
    <>
      {!redirectingAfterVerify && (
        <AuthShell
          title="Welcome to Yike"
          subtitle="Create your account in under a minute."
          compact
          centered
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
            <p className="mb-5 rounded-xl border border-gold/25 bg-gold/10 px-3 py-2.5 text-sm text-foreground">
              Agent verification after signup.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Full Name">
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl"
                autoComplete="name"
              />
            </Field>

            <Field label="Email Address">
              <Input
                type="email"
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
                <p className="mt-1.5 text-xs text-danger">{emailError}</p>
              ) : null}
            </Field>

            <Field label="Phone Number">
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
                value={phone}
                onChange={(e) => {
                  setPhone(digitsOnlyPhoneLocal(e.target.value));
                  if (phoneError) setPhoneError("");
                }}
                onBlur={() => {
                  if (!phone) return;
                  setPhoneError(validatePhoneField(phone));
                }}
                required
                className={cn(
                  "h-12 rounded-xl",
                  phoneError && "ring-2 ring-red-400/50"
                )}
                autoComplete="tel-national"
              />
              {phoneError ? (
                <p className="mt-1.5 text-xs text-danger">{phoneError}</p>
              ) : null}
            </Field>

            <Field label="Create PIN">
              <PasswordInput
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => {
                  const next = digitsOnly(e.target.value);
                  setPin(next);
                  setPinError("");
                  if (next.length === PIN_LENGTH) {
                    const policyError = pinPolicyError(next);
                    if (policyError) {
                      setPinError(policyError);
                      return;
                    }
                    window.requestAnimationFrame(() => {
                      confirmPinRef.current?.focus();
                    });
                  }
                }}
                maxLength={PIN_LENGTH}
                required
                className="h-12 rounded-xl tracking-[0.35em]"
                autoComplete="new-password"
                revealLabel="PIN"
              />
              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                  showPinHelper
                    ? "mt-1.5 grid-rows-[1fr] opacity-100"
                    : "mt-0 grid-rows-[0fr] opacity-0"
                )}
                aria-hidden={!showPinHelper}
              >
                <div className="overflow-hidden">
                  <p className="text-xs text-muted">
                    Use a 6-digit PIN you&apos;ll remember.
                  </p>
                </div>
              </div>
              {pinError && pin.length === PIN_LENGTH && confirmPin.length === 0 ? (
                <p className="mt-1.5 text-xs text-danger">{pinError}</p>
              ) : null}
            </Field>

            <Field label="Confirm PIN">
              <PasswordInput
                ref={confirmPinRef}
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(digitsOnly(e.target.value));
                  setPinError("");
                }}
                maxLength={PIN_LENGTH}
                required
                className={cn(
                  "h-12 rounded-xl tracking-[0.35em]",
                  confirmPin && confirmPin !== pin && "ring-2 ring-red-400/50"
                )}
                autoComplete="new-password"
                revealLabel="confirm PIN"
              />
              {confirmPin && confirmPin !== pin ? (
                <p className="mt-1.5 text-xs text-danger">PINs do not match</p>
              ) : pinError && confirmPin.length > 0 ? (
                <p className="mt-1.5 text-xs text-danger">{pinError}</p>
              ) : null}
            </Field>

            <Field label={`What is ${mathChallenge.a} + ${mathChallenge.b}?`}>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={`Answer: ${mathChallenge.a} plus ${mathChallenge.b}`}
                value={mathAnswer}
                onChange={(e) => setMathAnswer(digitsOnly(e.target.value, 3))}
                required
                className={cn(
                  "h-12 rounded-xl",
                  mathAnswer && !mathOk && "ring-2 ring-red-400/50"
                )}
                autoComplete="off"
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl py-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-[#E4B547]"
                required
              />
              <span className="text-sm leading-relaxed text-foreground">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gold-dark underline-offset-2 hover:underline dark:text-gold"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gold-dark underline-offset-2 hover:underline dark:text-gold"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            {error ? (
              <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger dark:bg-red-500/15 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <Button type="submit" fullWidth size="lg" disabled={!canSubmit}>
              {loading ? "Creating account…" : "Create Account"}
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
    <div className="space-y-2">
      <p className="text-sm font-semibold tracking-tight text-foreground">{label}</p>
      {children}
    </div>
  );
}

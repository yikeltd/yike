"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
import type { AccountType, Profile } from "@/types/database";
import {
  canRequestPhoneOtp,
  normalizeNigerianPhone,
} from "@/lib/phone";
import { PUBLIC_ERROR_FALLBACK, friendlyPublicError } from "@/lib/copy/public-errors";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES: { id: AccountType; label: string; hint: string }[] = [
  { id: "individual", label: "Individual", hint: "Home owner or personal listing" },
  { id: "landlord", label: "Landlord", hint: "Property owner listing directly" },
  { id: "agent", label: "Agent", hint: "Solo agent or broker" },
  { id: "agency", label: "Company", hint: "Registered property business" },
  {
    id: "developer",
    label: "Developer",
    hint: "Real estate developers and property development companies",
  },
];

export function BecomeAgentCard({
  profile,
  emailVerified,
}: {
  profile: Profile;
  phoneVerified?: boolean;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>(
    profile.account_type ?? "individual"
  );
  const [whatsapp, setWhatsapp] = useState(
    profile.whatsapp ?? profile.phone ?? ""
  );
  const [acceptRules, setAcceptRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const identityReady = emailVerified;

  async function becomeAgent() {
    if (!acceptRules) {
      setError("Please accept the listing terms to continue.");
      return;
    }

    const normalized = whatsapp.trim()
      ? normalizeNigerianPhone(whatsapp)
      : "";
    if (normalized && !canRequestPhoneOtp(normalized)) {
      setError("Use a valid Nigerian WhatsApp number or leave it blank.");
      return;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/agent/become", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountType,
        whatsapp: normalized || undefined,
        acceptRules: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(friendlyPublicError(data.error as string, PUBLIC_ERROR_FALLBACK));
      return;
    }
    router.push("/agent/profile-setup");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/25 bg-gold/10 p-5">
        <h1 className="text-xl font-bold text-navy">List on Yike</h1>
        <p className="mt-2 text-sm text-foreground">
          Verify your email, complete your profile, and start listing properties on Yike.
        </p>
      </div>

      <div className="flex gap-1">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1 flex-1 rounded-full",
              step >= n ? "bg-gold" : "bg-navy/10"
            )}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="space-y-3">
          <p className="text-sm font-bold text-navy">1. Account type</p>
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAccountType(t.id)}
              className={cn(
                "pressable w-full rounded-xl border p-4 text-left",
                accountType === t.id
                  ? "border-gold bg-gold/10"
                  : "border-border bg-elevated"
              )}
            >
              <p className="font-semibold text-navy">{t.label}</p>
              <p className="mt-1 text-xs text-muted">{t.hint}</p>
            </button>
          ))}
          <Button type="button" className="w-full" onClick={() => setStep(2)}>
            Continue
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <p className="text-sm font-bold text-navy">2. Listing rules</p>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
              Real prices only — no call-for-price bait
            </li>
            <li className="flex gap-2">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
              WhatsApp contact recommended for inquiries
            </li>
            <li className="flex gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" />
              Up to {UNVERIFIED_AGENT_LISTING_LIMIT} active listings while you grow
            </li>
          </ul>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-navy">WhatsApp number</p>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="08012345678"
              inputMode="tel"
            />
          </div>
          {!emailVerified && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Verify your email first.{" "}
              <Link href="/auth/verify-email?next=/agent/become" className="font-semibold underline">
                Verify email
              </Link>
            </p>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptRules}
              onChange={(e) => setAcceptRules(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to Yike listing{" "}
              <Link href="/terms" className="font-semibold text-gold-dark underline">
                terms and conditions
              </Link>
              .
            </span>
          </label>
          {error && (
            <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={!acceptRules || !identityReady || loading}
              onClick={() => void becomeAgent()}
            >
              {loading ? "Setting up…" : "Continue"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

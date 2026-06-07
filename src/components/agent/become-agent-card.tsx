"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UNVERIFIED_AGENT_LISTING_LIMIT } from "@/lib/agent-tiers";
import { isPhoneOtpEnabledClient } from "@/lib/feature-flags";
import type { Profile } from "@/types/database";

export function BecomeAgentCard({
  profile,
  phoneVerified,
  emailVerified,
}: {
  profile: Profile;
  phoneVerified: boolean;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function becomeAgent() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/agent/become", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/agent/listings/new");
    router.refresh();
  }

  const phoneRequired = isPhoneOtpEnabledClient();
  const ready = emailVerified && (!phoneRequired || phoneVerified);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/25 bg-gold/10 p-5">
        <h1 className="text-xl font-bold text-navy">Become an agent</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          List properties on Yike with low friction. No NIN or selfie required to
          start — verify later for the badge, higher ranking, and unlimited listings.
        </p>
      </div>

      <ul className="space-y-3 text-sm">
        <li className="flex gap-3 rounded-xl bg-elevated p-4 shadow-float">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
          <div>
            <p className="font-semibold text-navy">Start listing immediately</p>
            <p className="mt-1 text-muted">
              Up to {UNVERIFIED_AGENT_LISTING_LIMIT} active listings while you grow.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl bg-elevated p-4 shadow-float">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
          <div>
            <p className="font-semibold text-navy">Optional verified badge</p>
            <p className="mt-1 text-muted">
              Apply anytime for trust badge, priority ranking, and unlimited listings.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl bg-elevated p-4 shadow-float">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
          <div>
            <p className="font-semibold text-navy">Trust over time</p>
            <p className="mt-1 text-muted">
              We moderate listings and review verification manually — no heavy KYC at signup.
            </p>
          </div>
        </li>
      </ul>

      {phoneRequired && !phoneVerified && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Verify your phone first.{" "}
          <a href="/auth/verify-phone?next=/agent/become" className="font-semibold underline">
            Verify phone
          </a>
        </p>
      )}
      {(!phoneRequired || phoneVerified) && !emailVerified && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Verify your email first.{" "}
          <a href="/auth/verify-email?next=/agent/become" className="font-semibold underline">
            Verify email
          </a>
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="w-full"
        disabled={!ready || loading}
        onClick={() => void becomeAgent()}
      >
        {loading ? "Upgrading…" : "Become an agent & list property"}
      </Button>

      <p className="text-center text-xs text-muted">
        Already verified elsewhere?{" "}
        <a href="/agent/verification" className="font-semibold text-gold-dark">
          Apply for verified badge
        </a>
      </p>
    </div>
  );
}

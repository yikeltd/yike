import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: `Why verified on ${SITE_NAME}`,
  description:
    "What Yike verified means for agents and listings — identity checks, platform activity, and what we do not guarantee.",
};

export default function WhyVerifiedPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 lg:py-14">
      <h1 className="text-2xl font-bold text-navy lg:text-3xl">Why verified?</h1>
      <p className="mt-3 text-muted leading-relaxed">
        Verified badges on {SITE_NAME} help renters spot agents and listings we
        have reviewed on-platform. They are a trust signal — not a guarantee of
        property ownership.
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
          <ShieldCheck className="h-5 w-5 text-gold" />
          What verified means
        </h2>
        <ul className="space-y-3 text-sm leading-relaxed text-muted">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Agent identity and contact details were submitted and reviewed by Yike.
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            The agent has meaningful activity on Yike (listings, leads, or updates).
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            Listings with a verified badge passed our moderation checks for clarity
            and basic authenticity signals.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-bold text-navy">What we check</h2>
        <p className="text-sm leading-relaxed text-muted">
          Phone verification at signup, agent profile review, listing quality
          review, and ongoing moderation for scam patterns (fake prices, duplicate
          photos, call-for-price tricks).
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-amber-900">
          <AlertCircle className="h-5 w-5" />
          What verified does not mean
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
          Yike verifies identity and platform activity where applicable. Property
          ownership should still be confirmed before payment. Always inspect the
          home in person and confirm all fees on WhatsApp before transferring money.
        </p>
      </section>

      <p className="mt-8 text-sm text-muted">
        <Link href="/verify-agent" className="font-semibold text-gold-dark hover:underline">
          Apply for agent verification →
        </Link>
        {" · "}
        <Link href="/safety" className="font-semibold text-gold-dark hover:underline">
          Safety tips
        </Link>
      </p>
    </article>
  );
}

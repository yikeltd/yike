import Link from "next/link";
import {
  BadgeCheck,
  TrendingUp,
  Shield,
  Clock,
  FileCheck,
  Camera,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { PageHero } from "@/components/pages/page-hero";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { VERIFY_FAQS } from "@/constants/pageContent";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Verify as Agent | ${SITE_NAME}`,
  description:
    "Get the Verified badge — higher ranking, more trust, more visibility for Nigerian property agents.",
};

const TIMELINE = [
  { step: "1", title: "Create your Yike account", body: "One signup for renters and listers — verify phone and email." },
  { step: "2", title: "Become an agent & list", body: "Start posting immediately — no NIN required at signup." },
  { step: "3", title: "Apply for verified badge (optional)", body: "Submit NIN + selfie when you want more trust and visibility." },
  { step: "4", title: "Manual review & badge", body: "Our team reviews within 1–2 business days. Unlimited listings when approved." },
];

const BENEFITS = [
  { icon: TrendingUp, title: "Higher search ranking", body: "Verified agents surface first in browse and search." },
  { icon: Shield, title: "Renter trust", body: "Serious clients filter for Verified — stand out instantly." },
  { icon: BadgeCheck, title: "Prestigious badge", body: "Gold Verified badge on every listing you publish." },
];

export default async function VerifyAgentPage() {
  const user = await getSession();
  const isLoggedIn = !!user;

  return (
    <div className="pb-12">
      <PageHero
        title="Get verified on Yike"
        subtitle="Verify your identity to list property — more visibility, more trust, safer marketplace for everyone."
        image={PAGE_IMAGERY.verify}
        badge="Verified lister"
        variant="premium"
        cta={
          isLoggedIn
            ? { label: "Start verification", href: "/agent/verification" }
            : { label: "Create account", href: "/auth/signup" }
        }
        secondaryCta={{ label: "List property", href: "/post-property" }}
      />

      <section className="mx-auto max-w-4xl px-3 py-10 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-gold/10"
            >
              <Icon className="h-6 w-6 text-gold-dark" />
              <h2 className="mt-3 font-bold text-navy">{title}</h2>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy">Verification timeline</h2>
          <div className="mt-6 space-y-4">
            {TIMELINE.map((t) => (
              <div key={t.step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy">
                  {t.step}
                </span>
                <div>
                  <p className="font-bold text-navy">{t.title}</p>
                  <p className="text-sm text-muted">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl bg-surface p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy">
            <FileCheck className="h-5 w-5 text-gold-dark" />
            Upload requirements
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>• Valid government-issued photo ID (NIN slip, passport, driver&apos;s licence)</li>
            <li>• Clear selfie holding ID or matching face to ID photo</li>
            <li>• Active WhatsApp number matching your profile</li>
            <li>• Agency registration (optional but helps agencies)</li>
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted">
            <Camera className="mt-0.5 h-4 w-4 shrink-0" />
            Verification confirms identity — not property ownership or listing accuracy.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-gold/20 bg-gold/5 p-6">
          <h2 className="flex items-center gap-2 font-bold text-navy">
            <Clock className="h-5 w-5" />
            Ready to apply?
          </h2>
          {isLoggedIn ? (
            <Link
              href="/agent/verification"
              className="mt-4 inline-flex h-12 items-center rounded-xl bg-gold px-6 text-sm font-bold text-navy"
            >
              Go to verification form
            </Link>
          ) : (
            <Link
              href="/auth/signup"
              className="mt-4 inline-flex h-12 items-center rounded-xl bg-gold px-6 text-sm font-bold text-navy"
            >
              Create account first
            </Link>
          )}
        </section>
      </section>

      <FaqSection title="Verification FAQs" faqs={VERIFY_FAQS} />

      <CtaBanner
        title="Safer marketplace for all"
        body="Verified agents help renters find trusted listings — join the trusted network on Yike."
        primary={{
          label: isLoggedIn ? "Verify now" : "Create account",
          href: isLoggedIn ? "/agent/verification" : "/auth/signup",
        }}
      />
    </div>
  );
}

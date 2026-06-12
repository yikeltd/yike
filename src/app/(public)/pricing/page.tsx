import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Layers, Sparkles, Wallet } from "lucide-react";
import { getSession } from "@/lib/auth";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { PageHero } from "@/components/pages/page-hero";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PublicPricingClient } from "@/components/subscriptions/public-pricing-client";
import { PRICING_FAQS } from "@/constants/pageContent";
import { PAGE_IMAGERY } from "@/constants/pageImagery";

export const metadata: Metadata = {
  title: `Pricing for Agents & Developers`,
  description: `See Yike seller plan prices — start free, upgrade when you need more listings, analytics, and branding. Multi-month savings on ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/pricing` },
  openGraph: {
    title: `Pricing — ${SITE_NAME}`,
    description: "Transparent seller plans for Nigerian property listers. Free to start.",
    url: `${SITE_URL}/pricing`,
  },
};

const VALUE_PROPS = [
  {
    icon: Wallet,
    title: "Start free",
    body: "Publish listings without a subscription. Upgrade only when you outgrow the free slot limit.",
  },
  {
    icon: Sparkles,
    title: "Transparent pricing",
    body: "Monthly rates and multi-month savings shown upfront — no hidden fees from Yike on plans.",
  },
  {
    icon: BadgeCheck,
    title: "Built for trust",
    body: "Higher tiers include verification perks, analytics, and visibility tools serious sellers use.",
  },
  {
    icon: Layers,
    title: "Room to grow",
    body: "From solo agents to agencies and developers — pick the tier that matches your volume.",
  },
];

export default async function PricingPage() {
  const session = await getSession();
  const isLoggedIn = Boolean(session);

  return (
    <div className="pb-12">
      <PageHero
        title="Simple pricing for listers"
        subtitle="See what each plan costs before you sign up. Free listings stay available — pay only when you need more scale."
        image={PAGE_IMAGERY.premium}
        badge="Seller plans"
        variant="premium"
        cta={
          isLoggedIn
            ? { label: "View plans below", href: "#plans" }
            : { label: "Create free account", href: "/auth/signup" }
        }
        secondaryCta={{ label: "Compare plans", href: "#plans" }}
      />

      <section className="mx-auto max-w-5xl px-3 py-10 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-elevated px-4 py-4 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <h2 className="mt-3 text-sm font-bold text-navy">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-6xl scroll-mt-20 px-3 lg:px-6">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-gold">Live prices</p>
          <h2 className="mt-1 text-2xl font-bold text-navy lg:text-3xl">Choose your plan</h2>
          <p className="mt-2 text-sm text-muted">
            Toggle billing period to see upfront totals. Prices update here as we grow — always check
            this page for the latest rates.
          </p>
          {!isLoggedIn ? (
            <p className="mt-3 text-sm text-navy">
              Ready to list?{" "}
              <Link href="/auth/signup" className="font-semibold text-gold-dark underline">
                Sign up free
              </Link>{" "}
              or{" "}
              <Link href="/post-property" className="font-semibold text-navy underline">
                learn about listing
              </Link>
              .
            </p>
          ) : null}
        </div>

        <PublicPricingClient isLoggedIn={isLoggedIn} />
      </section>

      <div className="mx-auto max-w-3xl px-3 pt-8 lg:px-8">
        <FaqSection
          title="Pricing questions"
          subtitle="Straight answers before you commit."
          faqs={PRICING_FAQS}
        />
      </div>

      <CtaBanner
        title={isLoggedIn ? "Ready to upgrade?" : "Start listing for free"}
        body={
          isLoggedIn
            ? "Checkout is in your account — pick a plan above or open your plans page anytime."
            : "Create an account, publish your first listings, and upgrade when you need more slots."
        }
        primary={
          isLoggedIn
            ? { label: "Open plans & checkout", href: "/agent/plans" }
            : { label: "Create free account", href: "/auth/signup" }
        }
        secondary={{ label: "List property", href: "/post-property" }}
        variant="gold"
      />
    </div>
  );
}

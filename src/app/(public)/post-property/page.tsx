import Link from "next/link";
import {
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Clock,
  Camera,
  BadgeCheck,
} from "lucide-react";
import { getSession, getProfile } from "@/lib/auth";
import { canListProperties } from "@/lib/utils";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/pages/page-hero";
import { TrustPillars } from "@/components/pages/trust-pillars";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SITE_NAME } from "@/lib/constants";
import { ListPropertyNavLink } from "@/components/auth/list-property-button";
import { ExploreHubLinks } from "@/components/pages/explore-hub-links";

export const metadata = {
  title: `List Property Free | ${SITE_NAME}`,
  description:
    "Free listings for agents, agencies and landlords. Reach serious renters across Nigeria with WhatsApp contact.",
};

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Reach more serious renters",
    body: "Yike buyers and renters browse with intent — photos first, WhatsApp second.",
  },
  {
    icon: BadgeCheck,
    title: "Verified listers rank higher",
    body: "Complete identity verification for more visibility on cards and search results.",
  },
  {
    icon: Clock,
    title: "List in minutes",
    body: "Upload photos, set a real price, add WhatsApp — we review before go-live.",
  },
  {
    icon: Camera,
    title: "Visual-first listings",
    body: "Minimum 3 photos. Blurry or duplicate listings are rejected.",
  },
  {
    icon: ShieldCheck,
    title: "Trust marketplace",
    body: "Report tools and moderation keep low-quality listings off the feed.",
  },
];

export default async function PostPropertyPage() {
  const user = await getSession();

  if (user) {
    const profile = await getProfile(user.id);
    if (profile && canListProperties(profile)) {
      redirect("/agent/listings/new");
    }
    if (profile) {
      redirect("/agent/become");
    }
  }

  return (
    <div className="pb-12">
      <PageHero
        title="List your property on Yike"
        subtitle="Create your account, verify your email, then list for free. Real prices only — no call for price."
        image={PAGE_IMAGERY.list}
        badge="For agents & landlords"
        cta={{ label: "Create account", href: "/auth/signup" }}
        secondaryCta={{ label: "Log in", href: "/auth/login" }}
      />

      <section className="mx-auto max-w-4xl px-3 py-10 lg:px-8">
        <ExploreHubLinks active="/post-property" className="mb-8" />
        <h2 className="text-xl font-bold text-navy lg:text-2xl">Why list with Yike</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
            >
              <Icon className="h-6 w-6 text-gold-dark" />
              <h3 className="mt-3 font-bold text-navy">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-navy p-6 text-white lg:p-8">
          <h2 className="text-lg font-bold">How it works</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            {[
              "Create one Yike account — renters and listers use the same signup",
              "Verify your email",
              "Tap List Property → add your address and date of birth → post",
              "Optional verified badge later for more trust and visibility",
              "WhatsApp contact required · minimum 3 clear photos · real prices only",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <TrustPillars title="Trust messaging for your clients" />

        <div className="mt-10 text-center">
          <ListPropertyNavLink
            href="/post-property"
            className="pressable inline-flex h-14 min-w-[280px] items-center justify-center rounded-xl bg-gold text-base font-bold text-navy shadow-glow-gold"
          >
            List property on Yike
          </ListPropertyNavLink>
          <p className="mt-4 text-sm text-muted">
            Already registered?{" "}
            <Link href="/auth/login" className="font-semibold text-gold-dark">
              Log in
            </Link>
          </p>
        </div>
      </section>

      <CtaBanner
        title="Want the Verified badge?"
        body="Verified listers get higher ranking and more renter trust."
        primary={{ label: "Learn about verification", href: "/verify-agent" }}
        secondary={{ label: "Safety tips", href: "/safety" }}
        variant="gold"
      />
    </div>
  );
}

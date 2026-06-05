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
import { redirect } from "next/navigation";
import { PageHero } from "@/components/pages/page-hero";
import { TrustPillars } from "@/components/pages/trust-pillars";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SITE_NAME } from "@/lib/constants";

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
    title: "Verified agents rank higher",
    body: "Complete verification for more visibility on cards and search results.",
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
    body: "Report tools and moderation keep fake listings off the feed.",
  },
];

export default async function PostPropertyPage() {
  const user = await getSession();

  if (user) {
    const profile = await getProfile(user.id);
    if (
      profile &&
      ["agent", "admin", "super_admin"].includes(profile.role)
    ) {
      redirect("/agent/listings/new");
    }
  }

  return (
    <div className="pb-12">
      <PageHero
        title="List your property on Yike"
        subtitle="Free for agents, agencies and landlords. Every listing is reviewed — real prices only, no call for price."
        image={PAGE_IMAGERY.list}
        badge="For agents & landlords"
        cta={{ label: "Sign up free", href: "/auth/signup?role=agent" }}
        secondaryCta={{ label: "Log in", href: "/auth/login" }}
      />

      <section className="mx-auto max-w-4xl px-3 py-10 lg:px-8">
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
          <h2 className="text-lg font-bold">Listing requirements</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/90">
            {[
              "WhatsApp contact required on every listing",
              "Minimum 3 clear photos — no watermarked stock images",
              'Real numeric prices — "call for price" is not allowed',
              "Accurate location (city, area, landmark hint)",
              "Listings expire after 14 days — renew anytime free",
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
          <Link
            href="/auth/signup?role=agent"
            className="pressable inline-flex h-14 min-w-[280px] items-center justify-center rounded-xl bg-gold text-base font-bold text-navy shadow-glow-gold"
          >
            Create agent account — free
          </Link>
          <p className="mt-4 text-sm text-muted">
            Already registered?{" "}
            <Link href="/auth/login" className="font-semibold text-gold-dark">
              Log in to upload
            </Link>
          </p>
        </div>
      </section>

      <CtaBanner
        title="Want the Verified badge?"
        body="Verified agents get higher ranking and more renter trust."
        primary={{ label: "Verify as agent", href: "/verify-agent" }}
        secondary={{ label: "Safety tips", href: "/safety" }}
        variant="gold"
      />
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { SOCIAL_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { PageHero } from "@/components/pages/page-hero";
import { TrustPillars } from "@/components/pages/trust-pillars";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";

export const metadata = {
  title: `About ${SITE_NAME}`,
  description: `${SITE_TAGLINE} Learn why we built Nigeria's visual, trust-first housing marketplace.`,
};

const MISSION_BLOCKS = [
  {
    title: "Nigerian housing is broken",
    body: "Fake listings, agent drama and WhatsApp scams waste time and money. Renters deserve to see real homes before they pay anyone.",
  },
  {
    title: "Visual-first browsing",
    body: "Photos before paragraphs. Scroll like social media, contact like messaging — built for how Nigerians actually search for homes.",
  },
  {
    title: "City-first, nationwide",
    body: "From Aba to Lagos to Uyo — underserved cities get the same premium experience as mega cities.",
  },
  {
    title: "Trust without overpromising",
    body: "We verify agent identity where possible. We do not claim ownership verification or guaranteed scam-free listings.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-12">
      <PageHero
        title={`Why ${SITE_NAME} exists`}
        subtitle={SITE_TAGLINE}
        image={PAGE_IMAGERY.about}
        badge="Our story"
        secondaryCta={{ label: "Browse homes", href: "/explore" }}
      />

      <section className="mx-auto max-w-4xl px-3 py-12 lg:px-8">
        <p className="text-base leading-relaxed text-muted lg:text-lg">
          {SITE_NAME} is a mobile-first Nigerian housing marketplace built for
          speed, trust, and simplicity. We help renters and buyers discover
          real listings, contact agents on WhatsApp instantly, and avoid the
          chaos of scattered Facebook posts and unverified agents.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MISSION_BLOCKS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
            >
              <h2 className="font-bold text-navy">{b.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-navy">The team</h2>
          <p className="mt-2 text-sm text-muted">
            Remote-first builders across Nigeria — product, engineering and
            community working to make housing discovery honest and fast.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-2xl bg-surface"
              >
                <Image
                  src={`https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=70&auto=format&fit=crop&sat=-100&hue=${i * 40}`}
                  alt=""
                  width={200}
                  height={200}
                  className="h-full w-full object-cover opacity-80"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </section>

        <TrustPillars title="Our trust pillars" />

        <section className="mt-10 rounded-2xl bg-gold/10 p-6">
          <h2 className="font-bold text-navy">Safety commitment</h2>
          <p className="mt-2 text-sm text-muted">
            We moderate listings, verify agents, and publish scam prevention
            guides — but you must always inspect properties in person before
            payment. Read our{" "}
            <Link href="/safety" className="font-semibold text-gold-dark">
              safety tips
            </Link>{" "}
            and{" "}
            <Link href="/disclaimer" className="font-semibold text-gold-dark">
              disclaimer
            </Link>
            .
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <a href={SOCIAL_LINKS.facebook} className="text-gold-dark">
            Facebook
          </a>
          <a href={SOCIAL_LINKS.x} className="text-gold-dark">
            X
          </a>
          <a href={SOCIAL_LINKS.youtube} className="text-gold-dark">
            YouTube
          </a>
          <a href={SOCIAL_LINKS.tiktok} className="text-gold-dark">
            TikTok
          </a>
        </div>
      </section>

      <CtaBanner
        title="Ready to find a home?"
        body="Browse verified listings across Nigeria — or list your property free."
        primary={{ label: "Explore homes", href: "/explore" }}
        secondary={{ label: "List property", href: "/post-property" }}
      />
    </div>
  );
}

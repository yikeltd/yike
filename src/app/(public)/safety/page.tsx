import Link from "next/link";
import { ShieldAlert, MapPin, AlertTriangle, Phone } from "lucide-react";
import { PageHero } from "@/components/pages/page-hero";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SAFETY_WARNING, SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Safety Tips for Renting in Nigeria | ${SITE_NAME}`,
  description:
    "Avoid fake agents, inspection fee scams and rental fraud. Practical safety checklist for Nigerian renters and buyers.",
};

const SCAM_FLAGS = [
  "Agent refuses physical viewing or sends a different unit",
  "Pressure to pay before you inspect the property",
  "Price far below market with luxury photos",
  "Only accepts transfer to personal accounts — no receipts",
  "Duplicate listing photos across multiple cities",
  "Cannot explain agency affiliation or office address",
];

const CITY_SCAM_TIPS = [
  {
    city: "Lagos",
    tip: "Extra caution in Lekki/Ajah — verify estate security and actual unit before agency fees.",
  },
  {
    city: "Abuja",
    tip: "Confirm plot numbers in Gwarinpa, Lugbe and Kubwa match survey pins on site.",
  },
  {
    city: "Port Harcourt",
    tip: "GRA listings attract impersonators — meet at the property, not a proxy location.",
  },
  {
    city: "Enugu / Aba",
    tip: "Student areas see seasonal scams near resumption — inspect with a friend.",
  },
];

const SAFETY_FAQS = [
  {
    q: "Should I pay an inspection fee?",
    a: "Be cautious. Some legitimate agents charge small viewing fees, but widespread scam pattern is upfront payment before any viewing. Prefer agents who meet you at the property first.",
  },
  {
    q: "How do I verify a landlord?",
    a: "Ask for ID, agency affiliation, and neighbours who can confirm tenancy. For purchases, use a lawyer for title search — Yike does not verify ownership.",
  },
  {
    q: "What if I already paid a scammer?",
    a: "Report to police/EFCC where appropriate, notify your bank immediately, and report the listing on Yike with screenshots.",
  },
];

export default function SafetyPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Stay safe while house hunting"
        subtitle="Practical advice for Nigerian renters and buyers — avoid fake agents, inspect first, pay smart."
        image={PAGE_IMAGERY.safety}
        badge="Safety"
        variant="dark"
        imageOpacity={0.26}
        cta={{ label: "Browse verified listings", href: "/search?verified=1" }}
      />

      <div className="mx-auto max-w-4xl px-3 py-10 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="flex items-start gap-2 text-sm text-amber-950 dark:text-amber-100">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            {SAFETY_WARNING}
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">Rental checklist</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <span className="font-bold text-gold-dark">1.</span>
              Visit the property — check water, light, roads, security
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gold-dark">2.</span>
              Confirm who owns or manages the unit
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gold-dark">3.</span>
              Get fees in writing — rent, caution, agreement, agency
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gold-dark">4.</span>
              Use Verified filters on Yike when possible
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-gold-dark">5.</span>
              Chat on WhatsApp but don&apos;t send large sums without inspection
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Scam red flags
          </h2>
          <ul className="mt-4 space-y-2">
            {SCAM_FLAGS.map((f) => (
              <li
                key={f}
                className="rounded-xl bg-white px-4 py-3 text-sm text-muted shadow-float"
              >
                {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <MapPin className="h-5 w-5 text-gold-dark" />
            City-specific awareness
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CITY_SCAM_TIPS.map((c) => (
              <div key={c.city} className="rounded-2xl bg-surface p-4">
                <p className="font-bold text-navy">{c.city}</p>
                <p className="mt-1 text-sm text-muted">{c.tip}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-navy p-6 text-white">
          <h2 className="flex items-center gap-2 font-bold">
            <Phone className="h-5 w-5 text-gold" />
            Report suspicious activity
          </h2>
          <p className="mt-2 text-sm text-white/85">
            Use the Report button on any listing, or email hello@yike.ng with the
            listing URL and screenshots. For emergencies involving fraud, contact
            local police or EFCC as appropriate.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm font-bold text-gold"
          >
            Contact support →
          </Link>
        </section>
      </div>

      <FaqSection title="Safety FAQs" faqs={SAFETY_FAQS} />

      <CtaBanner
        title="Avoid fake agents"
        body="Chat directly on WhatsApp with Verified agents — inspect properties before you pay."
        primary={{ label: "Verified listings", href: "/search?verified=1" }}
        secondary={{ label: "Read disclaimer", href: "/disclaimer" }}
      />
    </div>
  );
}

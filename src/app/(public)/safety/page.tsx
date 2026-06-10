import Link from "next/link";
import { ShieldAlert, MapPin, AlertTriangle, Phone } from "lucide-react";
import { PageHero } from "@/components/pages/page-hero";
import { FaqSection } from "@/components/pages/faq-section";
import { CtaBanner } from "@/components/pages/cta-banner";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Safety Tips for Renting in Nigeria | ${SITE_NAME}`,
  description:
    "Practical safety checklist for Nigerian renters and buyers — inspect smart, understand fees, and decide payments on your terms.",
};

const SCAM_FLAGS = [
  "Agent refuses physical viewing or sends a different unit",
  "Pressure to pay before you have inspected the property",
  "Price far below market with luxury photos only",
  "Only accepts transfer to personal accounts — no receipts",
  "Duplicate listing photos across multiple cities",
  "Cannot explain agency affiliation or office address",
];

const CITY_SCAM_TIPS = [
  {
    city: "Lagos",
    tip: "High-demand areas like Lekki, Ajah, Ikeja and Yaba see heavy listing volume. Confirm you are viewing the exact unit and estate access before paying agency or caution fees.",
  },
  {
    city: "Abuja",
    tip: "In Gwarinpa, Lugbe, Kubwa, Wuse and satellite districts, match posted plot or flat details on site. A written fee breakdown helps before you transfer.",
  },
  {
    city: "Port Harcourt",
    tip: "GRA, Woji and Rumuola attract premium rents. Many renters prefer meeting at the property gate or compound — not only a roadside handover.",
  },
  {
    city: "Enugu",
    tip: "Near UNN, ESCET and New Haven, student letting peaks around resumption. Bring someone along for viewings when you can.",
  },
  {
    city: "Aba",
    tip: "Commercial and residential listings move quickly. Confirm total move-in cost in writing and who receives each payment.",
  },
  {
    city: "Owerri",
    tip: "Areas around IMSU and Aladinma see seasonal demand. Compare multiple listings — photos are sometimes reused.",
  },
  {
    city: "Ibadan",
    tip: "Bodija, UI and Challenge vary in road access and utilities. A daylight visit helps you judge water, power and security.",
  },
  {
    city: "Benin City",
    tip: "USO and Ekehuan student corridors — verify who manages the compound and what utilities are included in the rent.",
  },
  {
    city: "Kano",
    tip: "Confirm estate or compound rules and who you are paying. Receipts help if you choose to pay any viewing or agency fee.",
  },
  {
    city: "Calabar / Uyo",
    tip: "Shortlet and yearly rents are quoted differently. Clarify whether the price is nightly, monthly or yearly before paying.",
  },
  {
    city: "Kaduna / Jos",
    tip: "Security and road access vary by district. Physical inspection tells you more than photos alone.",
  },
  {
    city: "Warri / Asaba",
    tip: "Oil-city rents shift with demand. Verify the listed address on maps and in person before large transfers.",
  },
];

const SAFETY_FAQS = [
  {
    q: "Should I pay an inspection fee?",
    a: "That is your decision. Some agents charge a viewing or logistics fee; others do not. If you pay, agree in writing what it covers. Many renters prefer to meet at the property first when possible.",
  },
  {
    q: "How do I verify a landlord?",
    a: "Ask for identification and any tenancy papers the agent can share. Speak with neighbours, estate security or facility managers where available. For purchases, a lawyer can run title searches — Yike verifies agent identity where marked Verified, not property ownership.",
  },
  {
    q: "What if I already paid a scammer?",
    a: "Contact your bank immediately to report the transfer. You can file a complaint with your local police station. For online fraud, Nigerians often also report to the EFCC (efcc.gov.ng). Report the Yike listing with screenshots so we can review it.",
  },
  {
    q: "Does Verified mean the property is safe to pay for?",
    a: "No. Verified means the agent passed Yike identity checks. You should still inspect the property and be comfortable with the terms before paying.",
  },
  {
    q: "Does Yike hold rent or caution deposits?",
    a: "No. Yike is a discovery platform. Payments are between you and the agent or landlord.",
  },
  {
    q: "What are common warning signs?",
    a: "Pressure to pay before any viewing, prices far below market with luxury photos only, refusal to meet at the property, or transfers to unrelated personal accounts without clear receipts.",
  },
];

export default function SafetyPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Stay safe while house hunting"
        subtitle="Practical advice for Nigerian renters and buyers — understand fees, inspect when you can, and decide payments on your terms."
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
            Yike does not process rent, caution deposits or viewing fees. How and when you pay
            is your decision — these tips are general guidance, not legal advice.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-navy">Rental checklist</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <span className="font-bold text-gold-dark">1.</span>
              Visit the property when you can — check water, light, roads, security
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
              Chat on WhatsApp — decide payment timing in a way that works for you
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
            listing URL and screenshots. For fraud involving money already transferred,
            contact your bank and local police; EFCC handles many online fraud reports
            in Nigeria.
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
        title="Browse with confidence"
        body="Chat on WhatsApp with Verified agents. Inspect properties and agree fees before you pay — on your timeline."
        primary={{ label: "Verified listings", href: "/search?verified=1" }}
        secondary={{ label: "Read disclaimer", href: "/disclaimer" }}
      />
    </div>
  );
}

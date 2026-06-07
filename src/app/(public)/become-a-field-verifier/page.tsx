import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { VerifierApplicationForm } from "@/components/verifier/verifier-application-form";
import { LEGAL_DISCLAIMER } from "@/lib/verifier/constants";

export const metadata = {
  title: `Become a Field Verifier — ${SITE_NAME}`,
  description:
    "Join Yike's independent property inspection network. Help buyers verify homes physically and earn per completed assignment.",
};

const RESPONSIBILITIES = [
  "Visit assigned properties and confirm physical details",
  "Upload structured observation reports with photos",
  "Follow Yike assignment rules — no self-selected jobs",
  "Maintain professional, neutral inspection standards",
];

const CAN_CONFIRM = [
  "Property exists at the listed location",
  "Photos roughly match the listing",
  "Occupancy and access conditions",
  "Road access and neighborhood observations",
];

const CANNOT = [
  "Guarantee legal ownership or title",
  "Approve land documents or C of O",
  "Act as legal counsel or notary",
];

export default function BecomeFieldVerifierPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Become a Yike Independent Property Verifier"
        subtitle="Help buyers verify properties physically and earn per completed inspection assignment."
        image={PAGE_IMAGERY.premium}
        badge="Trust infrastructure"
        cta={{ label: "Apply now", href: "#apply" }}
        secondaryCta={{ label: "Verifier dashboard", href: "/verifier" }}
        variant="premium"
      />

      <section className="mx-auto max-w-5xl px-3 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy">What field verifiers do</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {RESPONSIBILITIES.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy">You can confirm</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {CAN_CONFIRM.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy">You cannot</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {CANNOT.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-red-500">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-surface bg-surface/50 p-4">
              <p className="text-xs leading-relaxed text-muted">{LEGAL_DISCLAIMER}</p>
            </div>

            <p className="text-sm text-muted">
              This role is separate from{" "}
              <Link href="/become-an-ambassador" className="font-semibold text-gold-dark hover:underline">
                City Ambassadors
              </Link>{" "}
              (growth/onboarding). You may qualify for both later, but permissions stay separate.
            </p>
          </div>

          <div id="apply">
            <h2 className="mb-3 text-xl font-bold text-navy">Apply now</h2>
            <VerifierApplicationForm />
            <p className="mt-3 text-xs text-muted">
              Per-inspection pay after admin review — not salary. Applications reviewed manually.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

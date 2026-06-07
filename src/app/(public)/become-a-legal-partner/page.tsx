import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { LegalPartnerApplicationForm } from "@/components/legal-partner/legal-partner-application-form";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { LEGAL_DISCLAIMER } from "@/lib/legal-partner/constants";

export const metadata = {
  title: `Become a Legal Verification Partner — ${SITE_NAME}`,
  description:
    "Join Yike's independent legal review partner network. Help buyers review property documents through assignment-based legal assistance.",
};

const RESPONSIBILITIES = [
  "Review assigned property documents professionally",
  "Submit structured legal observations — not ownership guarantees",
  "Follow Yike assignment rules; no direct buyer side-deals",
  "Maintain confidentiality and operational communication via Yike",
];

const CAN_REVIEW = [
  "Deed of assignment, allocation papers, survey plans",
  "C of O copies, receipts, and agreements",
  "Document consistency and obvious legal red flags",
  "Registry/title search coordination when assigned",
];

const CANNOT = [
  "Guarantee ownership or certify property as “Yike approved”",
  "Bypass Yike to deal directly with buyers on platform leads",
  "Imply government certification or litigation immunity",
];

export default function BecomeLegalPartnerPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="Become a Yike Legal Verification Partner"
        subtitle="Help buyers review property documents and reduce legal uncertainty through independent legal review assistance."
        image={PAGE_IMAGERY.premium}
        badge="Legal trust infrastructure"
        cta={{ label: "Apply now", href: "#apply" }}
        secondaryCta={{ label: "Partner dashboard", href: "/legal-partner" }}
        variant="premium"
      />

      <section className="mx-auto max-w-5xl px-3 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-navy">What legal partners do</h2>
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
              <h2 className="text-xl font-bold text-navy">You may review</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {CAN_REVIEW.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-navy">You must not</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {CANNOT.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-red-500">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted leading-relaxed border-l-2 border-gold pl-3">
              {LEGAL_DISCLAIMER}
            </p>

            <p className="text-sm text-muted">
              Field verifiers handle physical inspections only. Legal partners handle document review
              only.{" "}
              <Link href="/become-a-field-verifier" className="font-bold text-gold-dark">
                Field verifier program →
              </Link>
            </p>
          </div>

          <div id="apply">
            <LegalPartnerApplicationForm />
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { FaqSection } from "@/components/pages/faq-section";
import { PageHero } from "@/components/pages/page-hero";
import { ContactForm, ContactSidebar } from "@/components/forms/contact-form";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { CONTACT_FAQS } from "@/constants/pageContent";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `Contact ${SITE_NAME}`,
  description: "Get support, report issues, or partner with Nigeria's visual housing marketplace.",
};

export default function ContactPage() {
  return (
    <div className="pb-12">
      <PageHero
        title="We're here to help"
        subtitle="Support, partnerships, scam reports and feedback — reach the Yike team."
        image={PAGE_IMAGERY.contact}
        badge="Contact"
        variant="warm"
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-3 py-12 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="rounded-2xl bg-white p-6 shadow-float ring-1 ring-black/[0.04] lg:p-8">
          <h2 className="text-lg font-bold text-navy">Send a message</h2>
          <p className="mt-1 text-sm text-muted">
            Fill the form — we respond within 1–2 business days.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
        <ContactSidebar />
      </div>

      <section className="mx-auto max-w-6xl px-3 lg:px-8">
        <h2 className="text-lg font-bold text-navy">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { href: "/safety", label: "Safety tips" },
            { href: "/disclaimer", label: "Disclaimer" },
            { href: "/request-property", label: "Request a home" },
            { href: "/verify-agent", label: "Verify as agent" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-navy hover:bg-gold/10"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <FaqSection title="Contact FAQs" faqs={CONTACT_FAQS} />
    </div>
  );
}

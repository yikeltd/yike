import { PageHero } from "@/components/pages/page-hero";
import { LegalVerificationForm } from "@/components/verification/legal-verification-form";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { LEGAL_DISCLAIMER } from "@/lib/legal-partner/constants";

export const metadata = {
  title: `Legal Review Assistance — ${SITE_NAME}`,
  description:
    "Request independent legal document review assistance before you commit to a Nigerian property purchase.",
};

type Props = {
  searchParams: Promise<{ property?: string; title?: string; propertyId?: string }>;
};

export default async function LegalVerificationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const propertyTitle = sp.title ? decodeURIComponent(sp.title) : "";
  const propertyId = sp.propertyId ? decodeURIComponent(sp.propertyId) : undefined;

  return (
    <div className="pb-12">
      <PageHero
        title="Legal review assistance for property documents"
        subtitle="Yike coordinates independent legal review through external partners — professional, careful, and operationally controlled."
        image={PAGE_IMAGERY.premium}
        badge="Document review"
        variant="premium"
      />

      <div className="mx-auto max-w-2xl px-3 py-8 lg:px-0">
        <p className="mb-6 text-sm text-muted leading-relaxed">{LEGAL_DISCLAIMER}</p>
        <LegalVerificationForm defaultPropertyTitle={propertyTitle} propertyId={propertyId} />
      </div>
    </div>
  );
}

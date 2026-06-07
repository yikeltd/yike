import { PageHero } from "@/components/pages/page-hero";
import { PropertyVerificationForm } from "@/components/verification/property-verification-form";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { VERIFICATION_LEGAL_DISCLAIMER } from "@/lib/verification/constants";

export const metadata = {
  title: `Property Verification — ${SITE_NAME}`,
  description:
    "Request independent physical property verification before you pay, travel, or commit.",
};

type Props = {
  searchParams: Promise<{ property?: string; title?: string }>;
};

export default async function PropertyVerificationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const propertyLink = sp.property ? decodeURIComponent(sp.property) : "";
  const propertyTitle = sp.title ? decodeURIComponent(sp.title) : "";

  return (
    <div className="pb-12">
      <PageHero
        title="Verify a property before you pay or travel"
        subtitle="Yike coordinates independent physical inspections — calm, professional, and operationally serious."
        image={PAGE_IMAGERY.premium}
        badge="Trust assistance"
        variant="premium"
      />

      <div className="mx-auto max-w-2xl px-3 py-8 lg:px-0">
        <p className="mb-6 text-sm text-muted leading-relaxed">{VERIFICATION_LEGAL_DISCLAIMER}</p>
        <PropertyVerificationForm
          defaultPropertyLink={propertyLink}
          defaultPropertyTitle={propertyTitle}
        />
      </div>
    </div>
  );
}

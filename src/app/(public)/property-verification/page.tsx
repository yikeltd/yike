import dynamic from "next/dynamic";
import { PageHero } from "@/components/pages/page-hero";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";
import { VERIFICATION_LEGAL_DISCLAIMER_SHORT } from "@/lib/verification/constants";

const PropertyVerificationForm = dynamic(
  () =>
    import("@/components/verification/property-verification-form").then((m) => ({
      default: m.PropertyVerificationForm,
    })),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-32 w-full rounded-xl" />
      </div>
    ),
  }
);

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
        subtitle="Independent physical checks before you pay or travel."
        image={PAGE_IMAGERY.premium}
        badge="Trust assistance"
        variant="premium"
      />

      <div className="mx-auto max-w-2xl px-3 py-8 lg:px-0">
        <p className="mb-6 text-xs text-muted">{VERIFICATION_LEGAL_DISCLAIMER_SHORT}</p>
        <PropertyVerificationForm
          defaultPropertyLink={propertyLink}
          defaultPropertyTitle={propertyTitle}
        />
      </div>
    </div>
  );
}

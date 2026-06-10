import dynamic from "next/dynamic";
import Link from "next/link";
import { PageHero } from "@/components/pages/page-hero";
import { SITE_NAME } from "@/lib/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";

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
        title="Verify a Property Before You Pay or Travel"
        subtitle="Request an independent physical inspection for a property you're considering."
        image={PAGE_IMAGERY.premium}
        badge="Trust assistance"
        variant="premium"
      />

      <div className="mx-auto max-w-2xl px-3 py-8 lg:px-0">
        <div className="mb-5 flex justify-end">
          <Link
            href="/property-verification/requests"
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-navy"
          >
            Verification requests
          </Link>
        </div>
        <PropertyVerificationForm
          defaultPropertyLink={propertyLink}
          defaultPropertyTitle={propertyTitle}
        />
      </div>
    </div>
  );
}

import { SITE_NAME } from "@/lib/constants";
import { PropertyRequestForm } from "@/components/property/property-request-form";
import { SafetyNotice } from "@/components/property/safety-notice";
import { ConversionStrip } from "@/components/conversion/conversion-strip";

export const metadata = {
  title: "Request a Property",
  description: `Tell ${SITE_NAME} what you need — we match you with agents in your area.`,
};

export default function RequestPropertyPage() {
  return (
    <div className="mx-auto max-w-xl px-3 py-6 lg:py-10">
      <h1 className="text-2xl font-bold text-navy lg:text-3xl">
        Request a property
      </h1>
      <p className="mt-2 text-sm text-muted">
        Can&apos;t find what you need? Tell us your budget and area — verified
        agents can reach you on WhatsApp when there&apos;s a match.
      </p>

      <div className="mt-8">
        <PropertyRequestForm />
      </div>

      <div className="mt-10 space-y-6">
        <SafetyNotice compact />
        <ConversionStrip />
      </div>
    </div>
  );
}

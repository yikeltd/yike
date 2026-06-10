import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function PropertyVerificationThankYouPage({ searchParams }: Props) {
  const sp = await searchParams;
  const reference = sp.ref?.trim() ?? "";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
      <h1 className="mt-4 text-2xl font-bold text-navy">
        Your verification request has been submitted.
      </h1>
      <p className="mt-3 text-sm text-muted leading-relaxed">
        Yike will review your request and contact you shortly on WhatsApp.
      </p>
      {reference ? (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm">
          Your reference: <span className="font-bold text-navy">{reference}</span>
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/property-verification/requests"
          className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-gold"
        >
          View verification requests
        </Link>
        <Link
          href="/property-verification"
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-bold text-navy"
        >
          Request another verification
        </Link>
      </div>
    </div>
  );
}

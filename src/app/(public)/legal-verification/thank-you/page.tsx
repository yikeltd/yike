import Link from "next/link";
import { LEGAL_DISCLAIMER } from "@/lib/legal-partner/constants";

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

export default async function LegalVerificationThankYouPage({ searchParams }: Props) {
  const sp = await searchParams;
  const ref = sp.ref ? decodeURIComponent(sp.ref) : "";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">Request received</p>
      <h1 className="mt-2 text-2xl font-bold text-navy">We will contact you on WhatsApp</h1>
      {ref ? (
        <p className="mt-3 text-sm text-muted">
          Reference: <span className="font-mono font-bold text-navy">{ref}</span>
        </p>
      ) : null}
      <p className="mt-4 text-sm text-muted leading-relaxed">
        Our team will review your request, guide document submission, and coordinate an independent
        legal partner assignment. This is review assistance — not an ownership or title guarantee.
      </p>
      <p className="mt-4 text-xs text-muted leading-relaxed">{LEGAL_DISCLAIMER}</p>
      <Link href="/" className="mt-8 inline-block rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy">
        Back to home
      </Link>
    </div>
  );
}

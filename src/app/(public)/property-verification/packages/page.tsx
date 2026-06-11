import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PropertyVerificationPackages } from "@/components/property-verification/property-verification-packages";

type Props = {
  searchParams: Promise<{ request?: string; ref?: string }>;
};

export const metadata = {
  title: "Choose Verification Package — Yike",
  description: "Select Basic, Standard, or Premium property verification.",
};

export default async function PropertyVerificationPackagesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const requestId = sp.request?.trim();
  if (!requestId) notFound();

  const admin = createAdminClient();
  let reference = sp.ref?.trim() ?? "";
  let diaspora = false;

  if (admin) {
    const { data } = await admin
      .from("property_verification_requests")
      .select("request_reference, is_diaspora_request, payment_status, property_title")
      .eq("id", requestId)
      .maybeSingle();

    if (!data) notFound();
    reference = data.request_reference ?? reference;
    diaspora = Boolean(data.is_diaspora_request);

    if (data.payment_status === "paid") {
      return (
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-navy">Payment already received</h1>
          <p className="mt-3 text-sm text-muted">
            Your {data.property_title ?? "property"} verification is queued for review.
          </p>
          <Link
            href={`/property-verification/requests/${requestId}`}
            className="mt-6 inline-flex rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-gold"
          >
            View request status
          </Link>
        </main>
      );
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/property-verification" className="text-sm font-bold text-gold-dark">
        ← Back
      </Link>
      <header className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Step 2 of 2
        </p>
        <h1 className="mt-1 text-2xl font-bold text-navy">Choose your verification package</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Independent physical inspection — not legal title or ownership verification.
        </p>
      </header>
      <div className="mt-8">
        <PropertyVerificationPackages
          requestId={requestId}
          reference={reference}
          diaspora={diaspora}
        />
      </div>
    </main>
  );
}

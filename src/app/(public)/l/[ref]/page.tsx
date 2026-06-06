import { notFound } from "next/navigation";
import Link from "next/link";
import { getHandoffByReference } from "@/lib/leads/handoff";
import { LeadHandoffActions } from "@/components/leads/lead-handoff-actions";

export const metadata = {
  title: "Chat Agent",
  robots: { index: false, follow: false },
};

export default async function LeadHandoffPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const data = await getHandoffByReference(decodeURIComponent(ref));
  if (!data) notFound();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg px-4 py-8 pb-24">
      <Link
        href={`/properties/${data.listingId}`}
        className="text-sm font-semibold text-gold-dark"
      >
        ← Back to listing
      </Link>
      <div className="mt-6">
        <LeadHandoffActions data={data} />
      </div>
    </div>
  );
}

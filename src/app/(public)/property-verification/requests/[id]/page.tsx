import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  checkLabels,
  priorityLabel,
  publicVerificationStatus,
  situationLabels,
  timelineLabel,
} from "@/lib/verification/public-request-display";

type Props = {
  params: Promise<{ id: string }>;
};

type RequestDetail = {
  id: string;
  request_reference: string | null;
  status: string | null;
  priority: string | null;
  preferred_timeline: string | null;
  preferred_contact_method: string | null;
  property_link: string | null;
  property_title: string | null;
  property_type: string | null;
  property_purpose: string | null;
  property_location_text: string | null;
  agent_company_name: string | null;
  asking_price: string | null;
  verification_needs: unknown;
  concern_flags: unknown;
  buyer_context: unknown;
  buyer_summary: string | null;
  requested_at: string | null;
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-navy">{value}</p>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">No specific items selected.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-navy">
          {item}
        </span>
      ))}
    </div>
  );
}

export default async function PropertyVerificationRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) notFound();

  const { data } = await supabase
    .from("property_verification_requests")
    .select(
      "id, request_reference, status, priority, preferred_timeline, preferred_contact_method, property_link, property_title, property_type, property_purpose, property_location_text, agent_company_name, asking_price, verification_needs, concern_flags, buyer_context, buyer_summary, requested_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const request = data as RequestDetail;
  const context =
    request.buyer_context && typeof request.buyer_context === "object"
      ? (request.buyer_context as Record<string, unknown>)
      : {};
  const combinedSituations = {
    ...(request.concern_flags && typeof request.concern_flags === "object"
      ? (request.concern_flags as Record<string, unknown>)
      : {}),
    ...(context.situationFlags && typeof context.situationFlags === "object"
      ? (context.situationFlags as Record<string, unknown>)
      : {}),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/property-verification/requests" className="text-sm font-bold text-gold-dark">
        Back to requests
      </Link>

      <section className="mt-5 rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              {request.request_reference ?? "Verification request"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-navy">
              {request.property_title || "Property"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {request.property_location_text || "Location pending"}
            </p>
          </div>
          <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">
            {publicVerificationStatus(request.status)}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailRow label="Urgency" value={priorityLabel(request.priority)} />
          <DetailRow label="Timeline" value={timelineLabel(request.preferred_timeline)} />
          <DetailRow label="Preferred contact" value={request.preferred_contact_method} />
          <DetailRow
            label="Submitted"
            value={
              request.requested_at
                ? new Date(request.requested_at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recently"
            }
          />
          <DetailRow label="Property type" value={request.property_type} />
          <DetailRow label="Purpose" value={request.property_purpose} />
          <DetailRow label="Agent / Company" value={request.agent_company_name} />
          <DetailRow label="Asking price / rent" value={request.asking_price} />
        </div>

        {request.property_link ? (
          <Link
            href={request.property_link}
            className="mt-5 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-bold text-navy"
          >
            Open property link
          </Link>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Requested checks</h2>
        <div className="mt-3">
          <ChipList items={checkLabels(request.verification_needs)} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-white p-5">
        <h2 className="text-sm font-bold text-navy">Situation</h2>
        <div className="mt-3">
          <ChipList items={situationLabels(combinedSituations)} />
        </div>
      </section>

      {request.buyer_summary ? (
        <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-sm font-bold text-navy">Verification summary</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy">
            {request.buyer_summary}
          </p>
        </section>
      ) : null}
    </main>
  );
}

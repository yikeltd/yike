import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkLabels,
  priorityLabel,
  publicVerificationStatus,
  situationLabels,
  timelineLabel,
} from "@/lib/verification/public-request-display";
import { PROPERTY_VERIFICATION_PACKAGES } from "@/lib/property-verification/packages";
import type { PropertyVerificationOrder } from "@/types/database";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
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

function orderStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PropertyVerificationRequestDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = await searchParams;
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

  let order: PropertyVerificationOrder | null = null;
  const admin = createAdminClient();
  if (admin) {
    const { data: orderRow } = await admin
      .from("property_verification_orders")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (orderRow as PropertyVerificationOrder | null) ?? null;
  }

  const paidBanner = sp.paid === "1" || order?.status === "paid";
  const pkg = order ? PROPERTY_VERIFICATION_PACKAGES[order.package_type] : null;
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

      {paidBanner ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Payment received — your verification is queued for assignment.
          {order?.verification_reference ? (
            <span className="mt-1 block font-semibold">{order.verification_reference}</span>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-950">
            Choose a verification package to continue.
          </p>
          <Link
            href={`/property-verification/packages?request=${id}&ref=${encodeURIComponent(request.request_reference ?? "")}`}
            className="mt-3 inline-flex rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold"
          >
            Choose package & pay
          </Link>
        </div>
      )}

      {order ? (
        <section className="mt-4 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-sm font-bold text-navy">Your package</h2>
          <p className="mt-2 text-sm text-navy">
            {pkg?.label ?? order.package_type} · {orderStatusLabel(order.status)}
          </p>
          {order.status === "completed" && order.report_summary ? (
            <div className="mt-4 space-y-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy">
                {order.report_summary}
              </p>
              {order.report_url ? (
                <a
                  href={order.report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold"
                >
                  Download report
                </a>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

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

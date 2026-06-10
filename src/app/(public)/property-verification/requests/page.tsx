import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  priorityLabel,
  publicVerificationStatus,
  timelineLabel,
} from "@/lib/verification/public-request-display";

export const metadata = {
  title: "Verification Requests - Yike",
  description: "View property verification requests submitted on Yike.",
};

type RequestRow = {
  id: string;
  request_reference: string | null;
  status: string | null;
  priority: string | null;
  preferred_timeline: string | null;
  preferred_contact_method: string | null;
  property_title: string | null;
  property_location_text: string | null;
  requested_at: string | null;
};

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 text-center">
      <h1 className="text-xl font-bold text-navy">No verification requests yet.</h1>
      <Link
        href="/property-verification"
        className="mt-5 inline-flex rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy"
      >
        Request property verification
      </Link>
    </div>
  );
}

export default async function PropertyVerificationRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  let requests: RequestRow[] = [];
  if (supabase && user) {
    const { data } = await supabase
      .from("property_verification_requests")
      .select(
        "id, request_reference, status, priority, preferred_timeline, preferred_contact_method, property_title, property_location_text, requested_at"
      )
      .order("requested_at", { ascending: false })
      .limit(50);
    requests = (data ?? []) as RequestRow[];
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Property verification
          </p>
          <h1 className="text-2xl font-bold text-navy">Verification requests</h1>
        </div>
        <Link
          href="/property-verification"
          className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-navy"
        >
          Request property verification
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-navy">
                    {request.property_title || "Property"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {request.property_location_text || "Location pending"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-surface px-3 py-1 text-navy">
                      {publicVerificationStatus(request.status)}
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1 text-muted">
                      {priorityLabel(request.priority)}
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1 text-muted">
                      {timelineLabel(request.preferred_timeline)}
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1 text-muted">
                      {request.preferred_contact_method || "WhatsApp"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    Submitted{" "}
                    {request.requested_at
                      ? new Date(request.requested_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "recently"}
                    {request.request_reference ? ` · ${request.request_reference}` : ""}
                  </p>
                </div>
                <Link
                  href={`/property-verification/requests/${request.id}`}
                  className="rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

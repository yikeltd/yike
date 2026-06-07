import { createAdminClient } from "@/lib/supabase/admin";
import { requireSupportConsole } from "@/lib/auth";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { InspectionRequestActions } from "@/components/admin/inspection-request-actions";
import { parseAdminPage } from "@/lib/admin/pagination";
import type { InspectionRequest, Property } from "@/types/database";
import Link from "next/link";

export default async function SupportInspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; id?: string }>;
}) {
  const params = await searchParams;
  const { page, from, to } = parseAdminPage(params);
  const { profile, user } = await requireSupportConsole();
  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Database unavailable.</p>;
  }

  let query = admin
    .from("inspection_requests")
    .select(
      `*, listing:properties!inspection_requests_listing_id_fkey (id, title, city, area, slug)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.id) {
    query = query.eq("id", params.id);
  }
  if (profile.role === "support") {
    query = query.eq("assigned_to", user.id);
  }

  const { data, count } = await query;
  const rows = (data ?? []) as (InspectionRequest & {
    listing?: Pick<Property, "id" | "title" | "city" | "area" | "slug"> | null;
  })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Inspection requests</h1>
        <p className="text-sm text-muted">
          Yike verification requests — manual follow-up and payment tracking
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-3 text-sm">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-lg border border-navy/15 px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="assigned">Assigned</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy px-4 py-2 font-semibold text-white"
        >
          Filter
        </button>
      </form>

      <ul className="space-y-4">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-navy/10 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">
                  {row.listing?.title ?? "Listing"}
                </p>
                <p className="text-sm text-muted">
                  {row.listing?.area}, {row.listing?.city}
                </p>
                {row.listing?.slug && (
                  <Link
                    href={`/properties/${row.listing.slug}`}
                    className="text-xs text-gold-dark underline"
                    target="_blank"
                  >
                    View listing
                  </Link>
                )}
              </div>
              <div className="text-right text-xs text-muted">
                <p>{new Date(row.created_at).toLocaleString("en-NG")}</p>
                <p className="capitalize">{row.status.replace("_", " ")}</p>
              </div>
            </div>
            <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Requester</dt>
                <dd>{row.requester_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd>{row.requester_email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">WhatsApp</dt>
                <dd>{row.requester_whatsapp ?? row.requester_phone ?? "—"}</dd>
              </div>
              {row.user_note && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">User note</dt>
                  <dd className="text-muted">{row.user_note}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4">
              <InspectionRequestActions request={row} />
            </div>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="text-center text-sm text-muted">No inspection requests yet.</p>
      )}

      <AdminPagination
        basePath="/lex/support/inspections"
        total={count ?? 0}
        page={page}
        params={{ status: params.status }}
      />
    </div>
  );
}

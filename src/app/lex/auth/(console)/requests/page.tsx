import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatPrice, listingTypeLabel } from "@/lib/utils";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <p className="text-sm text-muted">Connect Supabase to view requests.</p>;
  }

  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, count } = await supabase
    .from("property_requests")
    .select("*", { count: "exact" })
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .range(from, to);

  const requests = data ?? [];
  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Property requests</h1>
        <p className="mt-2 text-sm text-muted">
          Tenant demand — {total} open request
          {total === 1 ? "" : "s"}
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-sm text-muted shadow-float">
          No open requests yet.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl bg-white p-5 shadow-float"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy">
                    {r.area ? `${r.area}, ` : ""}
                    {r.city}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {listingTypeLabel(r.listing_type as "rent")}
                    {r.bedrooms ? ` · ${r.bedrooms} bed` : ""}
                    {r.property_type ? ` · ${r.property_type}` : ""}
                  </p>
                  {r.budget_max && (
                    <p className="mt-1 text-sm font-semibold text-gold-dark">
                      Budget up to{" "}
                      {formatPrice(Number(r.budget_max), "yearly", r.listing_type as "rent")}
                    </p>
                  )}
                </div>
                <a
                  href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy"
                >
                  WhatsApp
                </a>
              </div>
              {r.notes && (
                <p className="mt-3 text-sm text-muted">{r.notes}</p>
              )}
              <p className="mt-2 text-[11px] text-muted">
                {new Date(r.created_at).toLocaleString("en-NG")}
              </p>
            </article>
          ))}
        </div>
      )}
      <AdminPagination basePath="/lex/auth/requests" total={total} page={page} />
    </div>
  );
}

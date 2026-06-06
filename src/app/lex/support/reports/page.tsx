import { requireServerClient } from "@/lib/supabase/require-client";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { ResolveReportButton } from "@/app/lex/auth/(console)/reports/resolve-button";

export default async function SupportReportsPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("listing_reports")
    .select(`*, property:properties (id, title, area, city)`)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Listing reports" description="Review and update report status" />
      <div className="space-y-3">
        {(data ?? []).map((r) => (
          <article key={r.id} className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
            <p className="font-semibold text-navy">{r.reason}</p>
            <p className="mt-1 text-sm text-muted">{r.message}</p>
            <p className="mt-2 text-sm">
              Listing:{" "}
              <Link href={`/properties/${r.property_id}`} className="text-gold-dark">
                {r.property?.title ?? r.property_id}
              </Link>
            </p>
            <p className="text-xs text-muted">{r.reporter_name} · {r.reporter_phone}</p>
            <div className="mt-3">
              <ResolveReportButton reportId={r.id} />
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && (
          <p className="text-sm text-muted">No open reports</p>
        )}
      </div>
    </div>
  );
}

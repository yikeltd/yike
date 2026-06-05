import { requireServerClient } from "@/lib/supabase/require-client";
import Link from "next/link";
import { ResolveReportButton } from "./resolve-button";

export default async function AdminReportsPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("listing_reports")
    .select(`*, property:properties (id, title, area, city)`)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ul className="space-y-4">
        {(data ?? []).map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-border bg-white p-4"
          >
            <p className="font-semibold">{r.reason}</p>
            <p className="text-sm text-muted">{r.message}</p>
            <p className="text-sm">
              Listing:{" "}
              <Link
                href={`/properties/${r.property_id}`}
                className="text-primary"
              >
                {r.property?.title ?? r.property_id}
              </Link>
            </p>
            <p className="text-xs text-muted">
              {r.reporter_name} · {r.reporter_phone}
            </p>
            <div className="mt-3">
              <ResolveReportButton reportId={r.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

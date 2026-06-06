import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parseAdminPage } from "@/lib/admin/pagination";

export default async function SupportLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const { page, from, to } = parseAdminPage(sp);
  const supabase = await requireServerClient();
  const { data, count } = await supabase
    .from("leads")
    .select("*, property:properties(title, city, area)", { count: "exact" })
    .eq("lead_type", "whatsapp")
    .order("created_at", { ascending: false })
    .range(from, to);

  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="WhatsApp leads" description={`${total} recent contact handoffs`} />
      <div className="space-y-2">
        {(data ?? []).map((lead) => (
          <div key={lead.id} className="rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm">
            <p className="font-medium text-navy">
              {lead.property?.title ?? "Listing"} · {lead.property?.city}
            </p>
            <p className="text-xs text-muted">{new Date(lead.created_at).toLocaleString("en-NG")}</p>
          </div>
        ))}
      </div>
      <AdminPagination basePath="/lex/support/leads" total={total} page={page} />
    </div>
  );
}

import { requireServerClient } from "@/lib/supabase/require-client";
import { AdminPageHeader } from "@/components/admin/dashboard/admin-ui";

export default async function SupportLeadsPage() {
  const supabase = await requireServerClient();
  const { data } = await supabase
    .from("leads")
    .select("*, property:properties(title, city, area)")
    .eq("lead_type", "whatsapp")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="WhatsApp leads" description="Recent contact handoffs" />
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
    </div>
  );
}

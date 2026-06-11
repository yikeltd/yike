import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canListProperties } from "@/lib/agent-tiers";
import { getLeadInsightsAccess } from "@/lib/listing-leads/access";
import { listSellerLeads, leadDisplayName } from "@/lib/listing-leads/service";
import { LEAD_SOURCE_LABELS } from "@/lib/listing-leads/constants";
import type { Profile } from "@/types/database";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profileRow } = await admin
    .from("profiles")
    .select("id, role, subscription_plan_code, lead_insights_until")
    .eq("id", user.id)
    .single();

  if (!profileRow || !canListProperties(profileRow as Profile)) {
    return NextResponse.json({ error: "Lister account required" }, { status: 403 });
  }

  const access = await getLeadInsightsAccess(admin, profileRow as Profile);
  if (!access.hasExport) {
    return NextResponse.json(
      { error: "Lead export requires Pro plan or Lead Insights package" },
      { status: 403 }
    );
  }

  const { leads } = await listSellerLeads(admin, user.id, {
    profile: profileRow as Profile,
    limit: 5000,
  });

  const header = "date,lead_type,status,source,listing,lead_name\n";
  const rows = leads
    .map((lead) => {
      const date = new Date(lead.created_at).toISOString();
      const source =
        LEAD_SOURCE_LABELS[(lead.lead_source as keyof typeof LEAD_SOURCE_LABELS) ?? "other"] ??
        lead.lead_source;
      const listing = lead.listing?.title ?? "";
      const name = leadDisplayName(lead).replace(/"/g, '""');
      return `"${date}","${lead.lead_type}","${lead.status}","${source}","${listing.replace(/"/g, '""')}","${name}"`;
    })
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="yike-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

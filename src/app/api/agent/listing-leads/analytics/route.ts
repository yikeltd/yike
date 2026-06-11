import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canListProperties } from "@/lib/agent-tiers";
import { getListingLeadAnalytics } from "@/lib/listing-leads/analytics";
import { getLeadInsightsAccess } from "@/lib/listing-leads/access";
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
  const analytics = await getListingLeadAnalytics(admin, user.id);

  if (!access.hasAnalytics) {
    return NextResponse.json({
      access,
      analytics: {
        total: analytics.total,
        thisMonth: analytics.thisMonth,
        thisWeek: analytics.thisWeek,
        conversionRate: 0,
        bestListing: null,
        bySource: {},
        byType: {},
      },
    });
  }

  return NextResponse.json({ access, analytics });
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSubscriptionDashboardMetrics,
  mapPlanRow,
  SUBSCRIPTION_STATUS_TABS,
} from "@/lib/subscriptions/service";
import type { UserSubscriptionStatus } from "@/types/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() as UserSubscriptionStatus | undefined;

  let query = admin
    .from("user_subscriptions")
    .select("*, plan:subscription_plans(*), profile:profiles(full_name, email, company_name)")
    .order("created_at", { ascending: false })
    .limit(80);

  if (status && SUBSCRIPTION_STATUS_TABS.includes(status)) {
    query = query.eq("status", status);
  }

  const [{ data, error }, metrics] = await Promise.all([
    query,
    getSubscriptionDashboardMetrics(admin),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    subscriptions: (data ?? []).map((row) => {
      const r = row as Record<string, unknown> & { plan?: Record<string, unknown> };
      return {
        ...r,
        plan: r.plan ? mapPlanRow(r.plan) : null,
      };
    }),
    metrics,
    tabs: SUBSCRIPTION_STATUS_TABS.map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
    })),
  });
}

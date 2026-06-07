import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueScheduledCampaigns } from "@/lib/notifications/admin/send";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { processed, results } = await processDueScheduledCampaigns(admin);
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  for (const row of results) {
    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "notification.scheduled_processed",
      target_type: "notification_campaign",
      target_id: row.campaignId,
      metadata: {
        recipient_count: row.recipientCount,
        failed_count: row.failedCount,
        manual: true,
      },
      ip,
    });
  }

  return NextResponse.json({ ok: true, processed, results });
}

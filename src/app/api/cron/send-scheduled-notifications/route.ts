import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueScheduledCampaigns } from "@/lib/notifications/admin/send";
import { writeAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  const cronHeader =
    request.headers.get("x-cron-secret") ??
    request.headers.get("x-vercel-cron-secret");
  return auth === `Bearer ${secret}` || cronHeader === secret;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { processed, results } = await processDueScheduledCampaigns(admin);

  for (const row of results) {
    await writeAuditLog({
      actor_id: row.createdBy,
      actor_role: "admin",
      action: "notification.scheduled_processed",
      target_type: "notification_campaign",
      target_id: row.campaignId,
      metadata: {
        recipient_count: row.recipientCount,
        failed_count: row.failedCount,
        source: "cron",
      },
    });
  }

  return NextResponse.json({ ok: true, processed, results });
}

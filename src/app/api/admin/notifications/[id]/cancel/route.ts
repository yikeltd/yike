import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: campaign } = await admin
    .from("admin_notification_campaigns")
    .select("id, status, title")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (campaign.status === "sent" || campaign.status === "sending") {
    return NextResponse.json({ error: "Cannot cancel a sent campaign" }, { status: 400 });
  }

  await admin
    .from("admin_notification_campaigns")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "notification.cancelled",
    target_type: "notification_campaign",
    target_id: id,
    metadata: { title: campaign.title },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}

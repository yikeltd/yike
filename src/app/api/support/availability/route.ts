import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSupportApi } from "@/lib/admin/api-auth";
import { supportCanChangeAvailability } from "@/lib/admin/support-permissions";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AgentAvailabilityStatus,
  ListingAvailabilityStatus,
} from "@/types/database";

export async function PATCH(req: Request) {
  const auth = await requireSupportApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as {
    target: "agent" | "listing";
    id: string;
    availability_status: AgentAvailabilityStatus | ListingAvailabilityStatus;
  };

  if (!body.id || !body.target || !body.availability_status) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!supportCanChangeAvailability(auth.profile.role)) {
    return NextResponse.json({ error: "Action not permitted" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const table = body.target === "agent" ? "profiles" : "properties";

  const { error } = await admin
    .from(table)
    .update({
      availability_status: body.availability_status,
      availability_updated_at: now,
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action:
      body.target === "agent" ? "agent.availability" : "listing.availability",
    target_type: body.target,
    target_id: body.id,
    metadata: { availability_status: body.availability_status },
    ip,
  });

  return NextResponse.json({ ok: true });
}

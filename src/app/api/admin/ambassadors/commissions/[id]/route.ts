import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAmbassadorEarnings } from "@/lib/ambassador/commission";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as {
    action: "hide" | "reveal" | "reverse" | "hold" | "approve";
    hiddenReason?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: row } = await admin
    .from("ambassador_commissions")
    .select("id, ambassador_id, status, hidden_from_ambassador")
    .eq("id", id)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Commission not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  let patch: Record<string, unknown> = { updated_at: now };
  let action = "ambassador.commission.hide";

  switch (body.action) {
    case "hide":
      patch = {
        ...patch,
        hidden_from_ambassador: true,
        hidden_reason: body.hiddenReason?.trim() || "admin_discretion",
      };
      break;
    case "reveal":
      patch = {
        ...patch,
        hidden_from_ambassador: false,
        hidden_reason: null,
      };
      action = "ambassador.commission.hide";
      break;
    case "reverse":
      patch = {
        ...patch,
        status: "reversed",
        reversed_at: now,
      };
      action = "ambassador.commission.reverse";
      break;
    case "hold":
      patch = { ...patch, status: "held" };
      break;
    case "approve":
      patch = { ...patch, status: "approved" };
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await admin.from("ambassador_commissions").update(patch).eq("id", id);
  await refreshAmbassadorEarnings(admin, row.ambassador_id as string);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action,
    target_type: "ambassador_commission",
    target_id: id,
    metadata: { commissionAction: body.action, hiddenReason: body.hiddenReason ?? null },
    ip,
  });

  return NextResponse.json({ ok: true });
}

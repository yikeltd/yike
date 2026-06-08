import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { updateProviderStatus } from "@/lib/home-services/providers";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
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
    status?: string;
    adminNotes?: string;
  };

  if (!body.status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  await updateProviderStatus(admin, id, body.status, body.adminNotes);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "home_services.provider.status",
    target_type: "service_provider",
    target_id: id,
    metadata: body,
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { approveServiceProviderApplication, updateProviderStatus } from "@/lib/home-services/providers";

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
    action?: "approve" | "reject" | "pause" | "suspend" | "fraud_review" | "reinstate";
    reviewNotes?: string;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  if (body.action === "approve") {
    const result = await approveServiceProviderApplication(admin, {
      applicationId: id,
      approvedBy: auth.user.id,
      reviewNotes: body.reviewNotes,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } else {
    const statusMap: Record<string, string> = {
      reject: "rejected",
      pause: "paused",
      suspend: "suspended",
      fraud_review: "fraud_review",
      reinstate: "approved",
    };
    const appStatus = statusMap[body.action ?? ""];
    if (body.action === "reject") {
      await admin
        .from("service_provider_applications")
        .update({
          status: "rejected",
          reviewed_by: auth.user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: body.reviewNotes ?? null,
        })
        .eq("id", id);
    } else if (appStatus) {
      await updateProviderStatus(admin, id, appStatus, body.reviewNotes);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  }

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "home_services.provider.moderate",
    target_type: "service_provider_application",
    target_id: id,
    metadata: { action: body.action, notes: body.reviewNotes ?? null },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateVerificationOrderStatus } from "@/lib/property-verification/orders";
import type { PropertyVerificationOrderStatus } from "@/types/database";
import { appendTrustTimeline } from "@/lib/trust/operations/timeline";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  let body: {
    action?: string;
    assignedTo?: string;
    reportUrl?: string;
    reportSummary?: string;
    reportMedia?: Record<string, unknown>;
    reviewNotes?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: order } = await admin
    .from("property_verification_orders")
    .select("*, request:property_verification_requests(request_reference)")
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const action = body.action?.trim();

  if (action === "assign" && body.assignedTo) {
    const result = await updateVerificationOrderStatus(admin, id, "assigned", auth.user.id, {
      assigned_to: body.assignedTo,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (order.request_id) {
      await admin
        .from("property_verification_requests")
        .update({
          assigned_verifier_id: body.assignedTo,
          assigned_at: new Date().toISOString(),
          status: "assigned",
        })
        .eq("id", order.request_id);
    }

    return NextResponse.json({ ok: true, order: result.order });
  }

  if (action === "start_progress") {
    const result = await updateVerificationOrderStatus(admin, id, "in_progress", auth.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, order: result.order });
  }

  if (action === "complete") {
    const summary = body.reportSummary?.trim();
    if (!summary) {
      return NextResponse.json({ error: "Report summary required" }, { status: 400 });
    }

    const result = await updateVerificationOrderStatus(admin, id, "completed", auth.user.id, {
      report_url: body.reportUrl?.trim() || null,
      report_summary: summary,
      report_media: body.reportMedia ?? {},
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (order.request_id) {
      await admin
        .from("property_verification_requests")
        .update({
          buyer_summary: summary,
          delivered_at: new Date().toISOString(),
          status: "delivered",
        })
        .eq("id", order.request_id);

      const reqRef = (order.request as { request_reference?: string } | null)?.request_reference;
      await appendTrustTimeline(admin, {
        caseType: "property_verification",
        caseId: order.request_id as string,
        caseReference: reqRef,
        eventType: "delivered_to_buyer",
        title: "Verification report delivered",
        actorId: auth.user.id,
        actorRole: auth.profile.role,
      });
    }

    return NextResponse.json({ ok: true, order: result.order });
  }

  if (action === "cancel") {
    const result = await updateVerificationOrderStatus(
      admin,
      id,
      "cancelled" as PropertyVerificationOrderStatus,
      auth.user.id,
      { request_notes: body.reviewNotes?.trim() || null }
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, order: result.order });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

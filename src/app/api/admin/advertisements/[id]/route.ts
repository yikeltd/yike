import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateAdvertisementFromPayment } from "@/lib/advertisements/service";
import {
  createPaymentOrder,
  initializePayment,
} from "@/lib/payments/services/payment-service";
import { isFeaturedPaymentsEnabled } from "@/lib/feature-flags";
import { isPaystackConfigured } from "@/lib/payments/config";

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
    startsAt?: string | null;
    endsAt?: string | null;
    expiresAt?: string | null;
    enabled?: boolean | string;
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

  const { data: ad } = await admin.from("advertisements").select("*").eq("id", id).single();
  if (!ad) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const action = body.action?.trim();
  const now = new Date().toISOString();

  if (action === "update_schedule") {
    const patch: Record<string, unknown> = { updated_at: now };
    if ("startsAt" in body) {
      const raw = (body as { startsAt?: string | null }).startsAt;
      patch.starts_at = raw ? new Date(String(raw)).toISOString() : null;
    }
    if ("endsAt" in body || "expiresAt" in body) {
      const raw =
        (body as { endsAt?: string | null; expiresAt?: string | null }).endsAt ??
        (body as { expiresAt?: string | null }).expiresAt;
      patch.expires_at = raw ? new Date(String(raw)).toISOString() : null;
    }
    if ("enabled" in body) {
      const on =
        (body as { enabled?: boolean | string }).enabled === true ||
        String((body as { enabled?: boolean | string }).enabled) === "true";
      if (on) {
        await admin
          .from("advertisements")
          .update({ status: "paused", updated_at: now })
          .eq("placement", ad.placement)
          .eq("status", "active")
          .neq("id", id);
        patch.status = "active";
        if (!ad.starts_at) patch.starts_at = now;
      } else {
        patch.status = "paused";
      }
    }
    const { data: updated, error } = await admin
      .from("advertisements")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error || !updated) {
      return NextResponse.json(
        { error: error?.message ?? "Could not update" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, advertisement: updated });
  }

  if (action === "submit_pending") {
    await admin
      .from("advertisements")
      .update({ status: "pending", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "pause") {
    await admin
      .from("advertisements")
      .update({ status: "paused", updated_at: now })
      .eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "activate_waived") {
    const result = await activateAdvertisementFromPayment(admin, {
      advertisementId: id,
      paymentOrderId: "",
      paymentReference: `waived-${id.slice(0, 8)}`,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, advertisement: result.advertisement });
  }

  if (action === "checkout") {
    await admin
      .from("advertisements")
      .update({ status: "pending", updated_at: now })
      .eq("id", id);

    const paymentsLive = isFeaturedPaymentsEnabled() && isPaystackConfigured();
    const amount = Number(ad.amount);

    if (!paymentsLive) {
      const result = await activateAdvertisementFromPayment(admin, {
        advertisementId: id,
        paymentOrderId: "",
        paymentReference: `offline-${id.slice(0, 8)}`,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, paymentsLive: false });
    }

    const order = await createPaymentOrder(admin, {
      userId: auth.user.id,
      orderType: "advertisement",
      amount,
      entityId: id,
      metadata: {
        advertisement_id: id,
        placement: ad.placement,
        advertiser_name: ad.advertiser_name,
      },
    });

    const email = auth.user.email ?? "";
    const init = await initializePayment(admin, order.id, email);
    if (!init.authorizationUrl) {
      return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      authorizationUrl: init.authorizationUrl,
      reference: order.reference,
      paymentsLive: true,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

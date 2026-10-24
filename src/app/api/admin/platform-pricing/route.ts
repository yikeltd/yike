import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";

export const runtime = "nodejs";

const ALLOWED_SERVICES = new Set(["video_call_connected", "listing_boost"]);

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data } = await admin.from("platform_service_pricing").select("*").order("service_code");
  return NextResponse.json({ pricing: data ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    serviceCode?: string;
    priceCoins?: number | null;
    active?: boolean;
    label?: string;
    description?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const serviceCode = body.serviceCode?.trim();
  if (!serviceCode || !ALLOWED_SERVICES.has(serviceCode)) {
    return NextResponse.json({ error: "Invalid service code" }, { status: 400 });
  }

  if (body.priceCoins != null && (!Number.isInteger(body.priceCoins) || body.priceCoins <= 0)) {
    return NextResponse.json({ error: "priceCoins must be a positive integer" }, { status: 400 });
  }

  if (
    body.active === true &&
    serviceCode !== "listing_boost" &&
    (body.priceCoins == null || body.priceCoins <= 0)
  ) {
    return NextResponse.json(
      { error: "Approved price required before activation" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.user.id,
  };
  if (body.priceCoins !== undefined) patch.price_coins = body.priceCoins;
  if (body.active !== undefined) patch.active = body.active;
  if (body.label !== undefined) patch.label = body.label;
  if (body.description !== undefined) patch.description = body.description;

  const { data, error } = await admin
    .from("platform_service_pricing")
    .update(patch)
    .eq("service_code", serviceCode)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  void writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "platform_pricing_updated",
    target_type: "platform_service_pricing",
    target_id: serviceCode,
    metadata: { patch },
  });

  return NextResponse.json({ pricing: data });
}

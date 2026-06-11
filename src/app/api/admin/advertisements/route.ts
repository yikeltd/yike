import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AD_STATUS_TABS,
  computeAdAmount,
  getAdMetrics,
  validateAdCreateInput,
} from "@/lib/advertisements/service";
import type { AdvertisementStatus } from "@/types/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() as AdvertisementStatus | undefined;

  let query = admin
    .from("advertisements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  if (status && AD_STATUS_TABS.includes(status)) {
    query = query.eq("status", status);
  } else if (status === "paused") {
    query = query.eq("status", "paused");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const metrics = await Promise.all(
    rows.map(async (row) => ({
      id: row.id as string,
      ...(await getAdMetrics(admin, row.id as string)),
    }))
  );
  const metricsMap = Object.fromEntries(metrics.map((m) => [m.id, m]));

  return NextResponse.json({
    advertisements: rows.map((row) => ({
      ...row,
      metrics: metricsMap[row.id as string] ?? { impressions: 0, clicks: 0, ctr: 0 },
    })),
    tabs: [
      ...AD_STATUS_TABS.map((id) => ({
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
      })),
      { id: "paused", label: "Paused" },
    ],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let body: Record<string, string> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validationError = validateAdCreateInput({
    title: String(body.title ?? ""),
    advertiserName: String(body.advertiserName ?? ""),
    destinationUrl: String(body.destinationUrl ?? ""),
    placement: String(body.placement ?? ""),
    durationPlan: String(body.durationPlan ?? ""),
    imageUrl: String(body.imageUrl ?? ""),
  });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const amount = await computeAdAmount(admin, body.placement, body.durationPlan);
  if (amount == null) {
    return NextResponse.json({ error: "Invalid pricing" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("advertisements")
    .insert({
      title: body.title.trim(),
      advertiser_name: body.advertiserName.trim(),
      advertiser_type: body.advertiserType?.trim() || null,
      image_url: body.imageUrl.trim(),
      mobile_image_url: body.mobileImageUrl?.trim() || null,
      destination_url: body.destinationUrl.trim(),
      placement: body.placement,
      duration_plan: body.durationPlan,
      amount,
      status: "draft",
      created_by: auth.user.id,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create ad" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, advertisement: data });
}

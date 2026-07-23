import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AD_STATUS_TABS,
  computeAdAmount,
  getAdMetrics,
  validateAdCreateInput,
} from "@/lib/advertisements/service";
import {
  isDurationPlan,
  isHomepageAdSlot,
} from "@/lib/advertisements/constants";
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

  let body: Record<string, string | boolean | undefined> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const placement = String(body.placement ?? "");
  const adminManaged =
    body.adminManaged === true ||
    String(body.adminManaged ?? "") === "true" ||
    isHomepageAdSlot(placement);

  const title = String(body.title ?? body.campaignName ?? "").trim();
  const advertiserName = String(
    body.advertiserName ?? (adminManaged ? title || "Yike" : ""),
  ).trim();
  const destinationUrl = String(body.destinationUrl ?? body.clickUrl ?? "").trim();
  const imageUrl = String(body.imageUrl ?? body.bannerImageUrl ?? "").trim();
  const durationPlan = String(body.durationPlan ?? (adminManaged ? "month" : ""));
  const enabled =
    body.enabled === true ||
    String(body.enabled ?? "") === "true" ||
    String(body.enabled ?? "") === "1";

  const validationError = validateAdCreateInput({
    title,
    advertiserName,
    destinationUrl,
    placement,
    durationPlan,
    imageUrl,
    adminManaged,
  });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let amount = 0;
  if (!adminManaged) {
    const priced = await computeAdAmount(admin, placement, durationPlan);
    if (priced == null) {
      return NextResponse.json({ error: "Invalid pricing" }, { status: 400 });
    }
    amount = priced;
  } else if (isDurationPlan(durationPlan)) {
    amount = (await computeAdAmount(admin, placement, durationPlan)) ?? 0;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  let startsAt: string | null = null;
  let expiresAt: string | null = null;

  if (body.startsAt) {
    const d = new Date(String(body.startsAt));
    if (!Number.isNaN(d.getTime())) startsAt = d.toISOString();
  }
  if (body.endsAt || body.expiresAt) {
    const d = new Date(String(body.endsAt ?? body.expiresAt));
    if (!Number.isNaN(d.getTime())) expiresAt = d.toISOString();
  }

  let status: AdvertisementStatus = "draft";
  if (adminManaged && enabled) {
    status = "active";
    if (!startsAt) startsAt = nowIso;
    // Pause any other active ad on this placement
    await admin
      .from("advertisements")
      .update({ status: "paused", updated_at: nowIso })
      .eq("placement", placement)
      .eq("status", "active");
  }

  const { data, error } = await admin
    .from("advertisements")
    .insert({
      title,
      advertiser_name: advertiserName,
      advertiser_type: String(body.advertiserType ?? "").trim() || null,
      image_url: imageUrl,
      mobile_image_url: String(body.mobileImageUrl ?? "").trim() || null,
      destination_url: destinationUrl,
      placement,
      duration_plan: isDurationPlan(durationPlan) ? durationPlan : null,
      amount,
      status,
      starts_at: startsAt,
      expires_at: expiresAt,
      created_by: auth.user.id,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Could not create ad" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, advertisement: data });
}

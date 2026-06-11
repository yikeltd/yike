import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { EMAIL_AD_PLACEMENT_KEY } from "@/lib/email/ad-marker";
import { buildEmailAdBlock } from "@/lib/email/components/email-ad-block";
import { ensureEmailAdPlacement } from "@/lib/ads/ensure-placements";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdPlacement } from "@/types/database";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const placement = await ensureEmailAdPlacement();
  const previewHtml = placement?.image_url
    ? buildEmailAdBlock(placement)
    : "";

  return NextResponse.json({ placement, previewHtml });
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    alt_text?: string;
    is_active?: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
  };

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const imageUrl = body.image_url?.trim() ?? "";
  if (body.is_active && !imageUrl) {
    return NextResponse.json(
      { error: "Upload an image before going live" },
      { status: 400 }
    );
  }

  const payload = {
    title: body.title?.trim() || null,
    image_url: imageUrl || null,
    link_url: body.link_url?.trim() || null,
    alt_text: body.alt_text?.trim() ?? "",
    is_active: Boolean(body.is_active),
    starts_at: body.starts_at || null,
    ends_at: body.ends_at || null,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await admin
    .from("ad_placements")
    .update(payload)
    .eq("placement_key", EMAIL_AD_PLACEMENT_KEY)
    .select("*")
    .maybeSingle();

  if (!data) {
    await ensureEmailAdPlacement();
    const retry = await admin
      .from("ad_placements")
      .update(payload)
      .eq("placement_key", EMAIL_AD_PLACEMENT_KEY)
      .select("*")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Email placement unavailable" },
      { status: 500 }
    );
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "email.ad.update",
    target_type: "ad_placement",
    target_id: data.id,
    metadata: {
      is_active: payload.is_active,
      has_image: Boolean(payload.image_url),
      starts_at: payload.starts_at,
      ends_at: payload.ends_at,
    },
    ip,
  });

  return NextResponse.json({
    placement: data,
    previewHtml: data.image_url ? buildEmailAdBlock(data as AdPlacement) : "",
  });
}

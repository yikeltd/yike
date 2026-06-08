import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateAmbassadorCode,
  ambassadorSlugFromName,
} from "@/lib/ambassador/code";
import { cityHasCapacity, getCitySlot, incrementCityActiveSlots } from "@/lib/ambassador/slots";
import { getProgramConfig } from "@/lib/ambassador/commission";

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
    action: "approve" | "reject";
    notes?: string;
    commissionRate?: number;
  };

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: application } = await admin
    .from("ambassador_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();
  const now = new Date().toISOString();

  if (body.action === "reject") {
    await admin
      .from("ambassador_applications")
      .update({
        status: "rejected",
        reviewed_by: auth.user.id,
        reviewed_at: now,
        review_notes: body.notes?.trim() || null,
        updated_at: now,
      })
      .eq("id", id);

    await writeAuditLog({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "ambassador.reject",
      target_type: "ambassador_application",
      target_id: id,
      metadata: { notes: body.notes ?? null },
      ip,
    });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const slot = await getCitySlot(admin, application.city, application.state);
  if (slot && !cityHasCapacity(slot)) {
    return NextResponse.json(
      { error: "City slots are full. Increase capacity or waitlist this applicant." },
      { status: 409 }
    );
  }

  const config = await getProgramConfig(admin);
  const rate = body.commissionRate ?? config.default_commission_rate;

  let code = generateAmbassadorCode();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await admin
      .from("city_ambassadors")
      .select("id")
      .eq("ambassador_code", code)
      .maybeSingle();
    if (!clash) break;
    code = generateAmbassadorCode();
  }

  const slugBase = ambassadorSlugFromName(application.full_name);
  const slug = `${slugBase}-${code.split("-")[1]?.toLowerCase() ?? "yike"}`;

  const { data: existingAmbassador } = await admin
    .from("city_ambassadors")
    .select("id")
    .eq("application_id", id)
    .maybeSingle();

  let ambassadorId = existingAmbassador?.id as string | undefined;

  if (!ambassadorId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", application.email)
      .maybeSingle();

    const referralLink = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://yike.ng").replace(/\/$/, "")}/auth/signup?ref=${encodeURIComponent(code)}`;

    const { data: created, error } = await admin
      .from("city_ambassadors")
      .insert({
        application_id: id,
        profile_id: profile?.id ?? null,
        ambassador_code: code,
        ambassador_slug: slug,
        assigned_city: application.city,
        assigned_state: application.state,
        full_name: application.full_name,
        email: application.email,
        whatsapp_number: application.whatsapp,
        residential_address: application.residential_address,
        residential_city: application.city,
        residential_state: application.state,
        nearest_landmark: application.nearest_landmark,
        country: application.country ?? "Nigeria",
        referral_link: referralLink,
        status: "approved",
        commission_percentage: rate,
        identity_verification_level: "basic",
        verification_status: "pending_basic",
        payout_enabled: false,
        approved_by: auth.user.id,
        approved_at: now,
        last_activity_at: now,
      })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Could not create ambassador" }, { status: 500 });
    }

    ambassadorId = created.id;

    if (profile?.id) {
      await admin
        .from("profiles")
        .update({ account_type: "city_ambassador" })
        .eq("id", profile.id);
    }
  } else {
    await admin
      .from("city_ambassadors")
      .update({
        status: "approved",
        commission_percentage: rate,
        approved_by: auth.user.id,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", ambassadorId);
  }

  await admin
    .from("ambassador_applications")
    .update({
      status: "approved",
      waitlisted: false,
      reviewed_by: auth.user.id,
      reviewed_at: now,
      review_notes: body.notes?.trim() || null,
      updated_at: now,
    })
    .eq("id", id);

  if (slot) {
    await incrementCityActiveSlots(admin, application.city, application.state, 1);
  }

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "ambassador.approve",
    target_type: "city_ambassador",
    target_id: ambassadorId,
    metadata: { applicationId: id, code, rate },
    ip,
  });

  return NextResponse.json({ ok: true, ambassadorId, code });
}

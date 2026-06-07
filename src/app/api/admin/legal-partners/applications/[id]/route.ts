import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePartnerCode } from "@/lib/legal-partner/code";

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
  const body = (await req.json()) as { action: "approve" | "reject"; notes?: string };

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: application } = await admin
    .from("legal_partner_applications")
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
      .from("legal_partner_applications")
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
      action: "legal_partner.reject",
      target_type: "legal_partner_application",
      target_id: id,
      metadata: { notes: body.notes ?? null },
      ip,
    });

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const { data: existing } = await admin
    .from("legal_partners")
    .select("id, partner_code")
    .eq("application_id", id)
    .maybeSingle();

  let partnerId = existing?.id as string | undefined;
  let code = existing?.partner_code as string | undefined;

  if (!partnerId) {
    code = generatePartnerCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await admin
        .from("legal_partners")
        .select("id")
        .eq("partner_code", code)
        .maybeSingle();
      if (!clash) break;
      code = generatePartnerCode();
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, account_type")
      .ilike("email", application.email)
      .maybeSingle();

    const { data: created, error } = await admin
      .from("legal_partners")
      .insert({
        application_id: id,
        profile_id: profile?.id ?? null,
        partner_code: code,
        full_name: application.full_name,
        email: application.email,
        whatsapp_number: application.whatsapp,
        phone_number: application.phone_number,
        firm_name: application.firm_name,
        assigned_city: application.city,
        assigned_state: application.state,
        operating_cities: application.operating_cities,
        status: "approved",
        trust_level: "basic",
        payout_enabled: false,
        approved_by: auth.user.id,
        approved_at: now,
        last_activity_at: now,
      })
      .select("id")
      .single();

    if (error || !created) {
      return NextResponse.json({ error: "Could not create legal partner" }, { status: 500 });
    }

    partnerId = created.id;

    if (
      profile?.id &&
      profile.account_type !== "city_ambassador" &&
      profile.account_type !== "field_verifier"
    ) {
      await admin.from("profiles").update({ account_type: "legal_partner" }).eq("id", profile.id);
    }
  } else {
    await admin
      .from("legal_partners")
      .update({
        status: "approved",
        approved_by: auth.user.id,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", partnerId);
  }

  await admin
    .from("legal_partner_applications")
    .update({
      status: "approved",
      reviewed_by: auth.user.id,
      reviewed_at: now,
      review_notes: body.notes?.trim() || null,
      updated_at: now,
    })
    .eq("id", id);

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "legal_partner.approve",
    target_type: "legal_partner",
    target_id: partnerId,
    metadata: { applicationId: id, code },
    ip,
  });

  return NextResponse.json({ ok: true, partnerId, code });
}

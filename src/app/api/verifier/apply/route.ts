import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const phoneNumber = String(body.phoneNumber ?? "").trim() || null;
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const whyApply = String(body.whyApply ?? "").trim();

  if (!fullName || !email || !whatsapp || !city || !state || !residentialAddress || !whyApply) {
    return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("field_verifier_applications")
    .select("id")
    .ilike("email", email)
    .in("status", ["pending", "under_review", "approved"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "We already have an application for this email" }, { status: 409 });
  }

  const { data: row, error } = await admin
    .from("field_verifier_applications")
    .insert({
      full_name: fullName,
      email,
      whatsapp,
      phone_number: phoneNumber,
      gender: String(body.gender ?? "").trim() || null,
      residential_address: residentialAddress,
      city,
      state,
      nearest_landmark: String(body.nearestLandmark ?? "").trim() || null,
      occupation: String(body.occupation ?? "").trim() || null,
      real_estate_familiarity: String(body.realEstateFamiliarity ?? "").trim() || null,
      inspection_experience: String(body.inspectionExperience ?? "").trim() || null,
      transportation_available: body.transportationAvailable !== false,
      coverage_areas: String(body.coverageAreas ?? "").trim() || null,
      why_apply: whyApply,
      profile_photo_url: String(body.profilePhotoUrl ?? "").trim() || null,
      id_type: String(body.idType ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Could not submit application" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    applicationId: row.id,
    message: "Application received. Our trust team will review it shortly.",
  });
}

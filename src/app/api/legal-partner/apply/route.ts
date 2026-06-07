import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();
  const firmName = String(body.firmName ?? "").trim();
  const officeAddress = String(body.officeAddress ?? "").trim();
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const whyApply = String(body.whyApply ?? "").trim();

  if (!fullName || !email || !whatsapp || !firmName || !officeAddress || !city || !state || !whyApply) {
    return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("legal_partner_applications")
    .select("id")
    .ilike("email", email)
    .in("status", ["pending", "under_review", "approved"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "We already have an application for this email" }, { status: 409 });
  }

  const { data: row, error } = await admin
    .from("legal_partner_applications")
    .insert({
      full_name: fullName,
      email,
      whatsapp,
      phone_number: String(body.phoneNumber ?? "").trim() || null,
      profile_photo_url: String(body.profilePhotoUrl ?? "").trim() || null,
      firm_name: firmName,
      years_of_practice: body.yearsOfPractice != null ? Number(body.yearsOfPractice) : null,
      specializations: String(body.specializations ?? "").trim() || null,
      operating_cities: String(body.operatingCities ?? "").trim() || null,
      property_law_experience: String(body.propertyLawExperience ?? "").trim() || null,
      cac_number: String(body.cacNumber ?? "").trim() || null,
      enrollment_number: String(body.enrollmentNumber ?? "").trim() || null,
      office_address: officeAddress,
      city,
      state,
      nearest_landmark: String(body.nearestLandmark ?? "").trim() || null,
      why_apply: whyApply,
    })
    .select("id")
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Could not submit application" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Application received. Our trust team will review it manually.",
  });
}

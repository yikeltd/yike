import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cityHasCapacity, getCitySlot } from "@/lib/ambassador/slots";
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
  const city = String(body.city ?? "").trim();
  const state = String(body.state ?? "").trim();
  const whyApply = String(body.whyApply ?? "").trim();
  const occupation = String(body.occupation ?? "").trim() || null;
  const yearsExperience = Math.max(0, Number(body.yearsExperience) || 0);
  const marketKnowledge = String(body.marketKnowledge ?? "").trim() || null;
  const referralSource = String(body.referralSource ?? "").trim() || null;
  const residentialAddress = String(body.residentialAddress ?? "").trim();
  const nearestLandmark = String(body.nearestLandmark ?? "").trim() || null;

  if (!fullName || !email || !whatsapp || !city || !state || !whyApply || !residentialAddress) {
    return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("ambassador_applications")
    .select("id, status")
    .ilike("email", email)
    .in("status", ["pending", "under_review", "approved", "waitlisted"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "We already have an application for this email" },
      { status: 409 }
    );
  }

  const slot = await getCitySlot(admin, city, state);
  const waitlisted = slot ? !cityHasCapacity(slot) : true;

  const socialLinks = {
    instagram: String(body.instagram ?? "").trim() || null,
    facebook: String(body.facebook ?? "").trim() || null,
    tiktok: String(body.tiktok ?? "").trim() || null,
    linkedin: String(body.linkedin ?? "").trim() || null,
    twitter: String(body.twitter ?? "").trim() || null,
  };

  const status = waitlisted ? "waitlisted" : "pending";

  const { data: row, error } = await admin
    .from("ambassador_applications")
    .insert({
      full_name: fullName,
      email,
      whatsapp,
      city,
      state,
      occupation,
      years_experience: yearsExperience,
      why_apply: whyApply,
      market_knowledge: marketKnowledge,
      social_links: socialLinks,
      referral_source: referralSource,
      residential_address: residentialAddress,
      nearest_landmark: nearestLandmark,
      country: "Nigeria",
      status,
      waitlisted,
    })
    .select("id, status, waitlisted")
    .single();

  if (error || !row) {
    console.error("[ambassador/apply]", error?.message);
    return NextResponse.json({ error: "Could not submit application" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    applicationId: row.id,
    waitlisted: row.waitlisted,
    message: waitlisted
      ? "Application received — this city is currently full. You are on the waitlist."
      : "Application received. Our team will review it shortly.",
  });
}

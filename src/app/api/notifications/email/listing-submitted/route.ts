import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendListingSubmittedEmail } from "@/lib/email/service";
import { requireSessionApi } from "@/lib/email/notify-auth";

export async function POST(request: Request) {
  const session = await requireSessionApi();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: { propertyId?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const propertyId = String(body.propertyId ?? "").trim();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const { data: property } = await admin
    .from("properties")
    .select("id, title, city, agent_id, status")
    .eq("id", propertyId)
    .single();

  if (!property || property.agent_id !== session.user.id) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", session.user.id)
    .single();

  const email = session.user.email ?? profile?.email;
  if (!email) {
    return NextResponse.json({ ok: true, skipped: "no_email" });
  }

  await sendListingSubmittedEmail(admin, {
    email,
    fullName: profile?.full_name ?? "",
    userId: session.user.id,
    propertyId: property.id,
    listingTitle: property.title,
    city: property.city,
  });

  return NextResponse.json({ ok: true });
}

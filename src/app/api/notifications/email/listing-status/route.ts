import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendListingApprovedEmail,
  sendListingRejectedEmail,
} from "@/lib/email/service";
import { requireAdminApi } from "@/lib/email/notify-auth";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: { propertyId?: string; status?: string; reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const propertyId = String(body.propertyId ?? "").trim();
  const status = String(body.status ?? "").trim();

  if (!propertyId || !status) {
    return NextResponse.json({ error: "propertyId and status required" }, { status: 400 });
  }

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ ok: true, skipped: "status_not_emailed" });
  }

  const { data: property } = await admin
    .from("properties")
    .select("id, title, agent_id")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: agent } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", property.agent_id)
    .single();

  const { data: authUser } = await admin.auth.admin.getUserById(property.agent_id);
  const email = authUser?.user?.email ?? agent?.email;
  if (!email) {
    return NextResponse.json({ ok: true, skipped: "no_email" });
  }

  const fullName = agent?.full_name ?? "";
  if (status === "approved") {
    await sendListingApprovedEmail(admin, {
      email,
      fullName,
      propertyId: property.id,
      listingTitle: property.title,
    });
  } else {
    await sendListingRejectedEmail(admin, {
      email,
      fullName,
      propertyId: property.id,
      listingTitle: property.title,
      reason: body.reason,
    });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInspectionRequestAlert } from "@/lib/email/service";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as {
    listingId?: string;
    userNote?: string;
    requesterWhatsapp?: string;
    requesterPhone?: string;
  };

  const listingId = String(body.listingId ?? "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "Listing required" }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("properties")
    .select("id, title, city, area, status, expires_at")
    .eq("id", listingId)
    .maybeSingle();

  if (
    !listing ||
    listing.status !== "approved" ||
    new Date(listing.expires_at) <= new Date()
  ) {
    return NextResponse.json({ error: "Listing unavailable" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  const requesterName = profile?.full_name?.trim() || null;
  const requesterEmail = user.email ?? profile?.email ?? null;
  const requesterWhatsapp =
    body.requesterWhatsapp?.trim() || profile?.whatsapp?.trim() || null;
  const requesterPhone =
    body.requesterPhone?.trim() || profile?.phone?.trim() || null;
  const userNote = body.userNote?.trim().slice(0, 2000) || null;

  const { data: existing } = await supabase
    .from("inspection_requests")
    .select("id")
    .eq("listing_id", listingId)
    .eq("user_id", user.id)
    .in("status", ["pending", "contacted", "assigned", "scheduled"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyOpen: true,
      message:
        "You already have an open verification request for this home. Yike support will contact you with next steps.",
    });
  }

  const { data: created, error } = await supabase
    .from("inspection_requests")
    .insert({
      listing_id: listingId,
      user_id: user.id,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_phone: requesterPhone,
      requester_whatsapp: requesterWhatsapp,
      user_note: userNote,
      status: "pending",
      priority: "normal",
      payment_status: "not_requested",
    })
    .select("id")
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: error?.message ?? "Could not submit request" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  if (admin) {
    void sendInspectionRequestAlert(admin, {
      listingTitle: listing.title,
      listingCity: listing.city,
      listingArea: listing.area,
      requesterName: requesterName ?? "User",
      requesterEmail: requesterEmail ?? "",
      requestId: created.id,
    }).catch((err) => console.warn("[inspection-request] alert failed", err));
  }

  return NextResponse.json({
    ok: true,
    id: created.id,
    message:
      "Verification request received. Yike support will contact you with next steps.",
  });
}

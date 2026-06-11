import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { trackFeaturedListingEvent } from "@/lib/featured-promotions/analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: {
    listingId?: string;
    eventType?: "featured_impression" | "featured_click";
    sessionId?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = String(body.listingId ?? "").trim();
  const eventType = body.eventType;

  if (!listingId || (eventType !== "featured_impression" && eventType !== "featured_click")) {
    return NextResponse.json({ error: "listingId and eventType required" }, { status: 400 });
  }

  const user = await getSession();

  void trackFeaturedListingEvent(
    admin,
    listingId,
    eventType,
    user?.id ?? null,
    body.sessionId?.trim() || null
  );

  return NextResponse.json({ ok: true });
}

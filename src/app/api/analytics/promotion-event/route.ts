import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { trackPromotionListingEvent } from "@/lib/featured-promotions/analytics";
import type { PromotionAnalyticsClientEvent } from "@/lib/featured-promotions/analytics-client";

export const runtime = "nodejs";

const ALLOWED: PromotionAnalyticsClientEvent[] = [
  "featured_impression",
  "featured_click",
  "boost_impression",
  "boost_click",
];

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: {
    listingId?: string;
    eventType?: string;
    sessionId?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = String(body.listingId ?? "").trim();
  const eventType = body.eventType as PromotionAnalyticsClientEvent;

  if (!listingId || !ALLOWED.includes(eventType)) {
    return NextResponse.json({ error: "listingId and eventType required" }, { status: 400 });
  }

  const user = await getSession();

  void trackPromotionListingEvent(
    admin,
    listingId,
    eventType,
    user?.id ?? null,
    body.sessionId?.trim() || null
  );

  return NextResponse.json({ ok: true });
}

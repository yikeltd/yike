import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import {
  LISTING_EVENT_TYPES,
  logListingEvent,
  type ListingEventType,
} from "@/lib/listing-analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: {
    listingId?: string;
    eventType?: string;
    sessionId?: string;
    city?: string;
    state?: string;
    metadata?: Record<string, unknown>;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const listingId = String(body.listingId ?? "").trim();
  const eventType = String(body.eventType ?? "").trim() as ListingEventType;

  if (!listingId || !LISTING_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: "listingId and eventType required" }, { status: 400 });
  }

  const user = await getSession();

  void logListingEvent(admin, {
    listingId,
    eventType,
    userId: user?.id ?? null,
    sessionId: body.sessionId?.trim() || null,
    city: body.city?.trim() || null,
    state: body.state?.trim() || null,
    metadata: body.metadata,
  });

  return NextResponse.json({ ok: true });
}

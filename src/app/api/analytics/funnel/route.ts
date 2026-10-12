import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isFunnelEventType,
  type FunnelEventInput,
} from "@/lib/analytics/whatsapp-funnel";
import { logFunnelEvent } from "@/lib/analytics/whatsapp-funnel-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const eventType = String(body.eventType ?? "");

  if (!isFunnelEventType(eventType)) {
    return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
  }

  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  let agentId: string | null = null;
  if (listingId) {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    }
    const { data: listing } = await admin
      .from("properties")
      .select("agent_id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    agentId = listing.agent_id;
  }

  const user = await getSession();

  logFunnelEvent({
    eventType,
    listingId,
    agentId,
    userId: user?.id ?? null,
    guestId: typeof body.guestId === "string" ? body.guestId : null,
    sourcePage: typeof body.sourcePage === "string" ? body.sourcePage : null,
    sourceSurface: typeof body.sourceSurface === "string" ? body.sourceSurface : null,
    metadata:
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as FunnelEventInput["metadata"])
        : {},
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
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

  logFunnelEvent({
    eventType,
    listingId: typeof body.listingId === "string" ? body.listingId : null,
    agentId: typeof body.agentId === "string" ? body.agentId : null,
    leadId: typeof body.leadId === "string" ? body.leadId : null,
    userId: typeof body.userId === "string" ? body.userId : null,
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

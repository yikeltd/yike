import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession, getProfile } from "@/lib/auth";
import { writeAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: {
    propertyId?: string;
    price?: number;
    market_snapshot?: Record<string, unknown>;
    anomaly_level?: string;
    anomaly_reason?: string;
    confidence_score?: number;
  } = {};

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
    .select("id, agent_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property || property.agent_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    price_review_status: "confirmed_by_agent",
    price_reviewed_by: user.id,
    price_reviewed_at: now,
    updated_at: now,
  };

  if (body.price != null) updates.price = body.price;
  if (body.market_snapshot) updates.market_price_snapshot = body.market_snapshot;
  if (body.anomaly_level) updates.price_anomaly_level = body.anomaly_level;
  if (body.anomaly_reason) updates.price_anomaly_reason = body.anomaly_reason;
  if (body.confidence_score != null) {
    updates.price_confidence_score = body.confidence_score;
  }

  const { error } = await admin.from("properties").update(updates).eq("id", propertyId);
  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }

  const profile = await getProfile(user.id);
  void writeAuditLog({
    actor_id: user.id,
    actor_role: profile?.role ?? "agent",
    action: "listing.price_confirmed",
    target_type: "property",
    target_id: propertyId,
    metadata: { anomaly_level: body.anomaly_level },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SUSPICIOUS_TYPES = [
  "login.failed",
  "pin.failed",
  "pin.locked",
  "sensitive.failed",
  "device.new",
] as const;

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const eventType = url.searchParams.get("type")?.trim();
  const userId = url.searchParams.get("user")?.trim();
  const suspiciousOnly = url.searchParams.get("suspicious") === "1";
  const from = url.searchParams.get("from")?.trim();
  const to = url.searchParams.get("to")?.trim();

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let query = admin
    .from("auth_security_events")
    .select(
      "id, user_id, event_type, metadata, ip_hash, created_at, profiles:user_id (email, username, full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (suspiciousOnly) {
    query = query.in("event_type", [...SUSPICIOUS_TYPES]);
  }

  if (from) {
    query = query.gte("created_at", from);
  }

  if (to) {
    query = query.lte("created_at", to);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}

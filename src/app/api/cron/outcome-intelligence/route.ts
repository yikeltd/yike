import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runOutcomeIntelligenceBatch } from "@/lib/outcome-intelligence/recalculate";
import { writeAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  const cronHeader =
    request.headers.get("x-cron-secret") ??
    request.headers.get("x-vercel-cron-secret");
  return auth === `Bearer ${secret}` || cronHeader === secret;
}

/** Background outcome learning — async, never blocks listing flow */
export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const result = await runOutcomeIntelligenceBatch(admin);

  void writeAuditLog({
    actor_id: "00000000-0000-0000-0000-000000000000",
    actor_role: "admin",
    action: "outcome.recalculated",
    target_type: "system",
    target_id: "outcome_intelligence",
    metadata: result,
  });

  return NextResponse.json({ ok: true, ...result });
}

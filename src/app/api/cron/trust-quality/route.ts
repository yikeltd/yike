import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTrustQualityBatch } from "@/lib/trust/recalculate";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const result = await runTrustQualityBatch(admin);
  return NextResponse.json({ ok: true, ...result });
}

import { NextResponse } from "next/server";
import {
  getSendchampConfigSummary,
  runSendchampDiagnostics,
} from "@/lib/notifications/providers/sendchamp";

export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

/** Ops-only: surface exact Sendchamp API errors from production. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getSendchampConfigSummary();
  const steps = await runSendchampDiagnostics();

  return NextResponse.json({
    ok: steps.some((s) => s.ok),
    config,
    steps,
  });
}

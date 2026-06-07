import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  markInactiveAmbassadors,
  releaseDueCommissions,
  runMonthlyAmbassadorReset,
} from "@/lib/ambassador/commission";
import { lagosYearMonth } from "@/lib/ambassador/constants";

export const runtime = "nodejs";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function isFirstOfMonthLagos(): boolean {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    hour: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  return day === "1" && hour === "1";
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const released = await releaseDueCommissions(admin);
  const inactive = await markInactiveAmbassadors(admin);

  let monthlyReset = false;
  if (isFirstOfMonthLagos()) {
    await runMonthlyAmbassadorReset(admin);
    monthlyReset = true;
  }

  return NextResponse.json({
    ok: true,
    period: lagosYearMonth(),
    releasedCommissions: released,
    markedInactive: inactive,
    monthlyReset,
  });
}

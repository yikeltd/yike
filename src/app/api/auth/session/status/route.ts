import { NextResponse } from "next/server";
import {
  evaluateSessionStatus,
  getAuthenticatedUserId,
  markSessionLocked,
  touchSessionActivity,
} from "@/lib/auth/session-state";
import { getDeviceTokenFromCookies } from "@/lib/auth/trusted-device";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({
      authenticated: false,
      locked: false,
      requiresFullLogin: false,
      requiresPinSetup: false,
    });
  }

  const deviceToken = await getDeviceTokenFromCookies();
  const status = await evaluateSessionStatus({ userId, deviceToken });

  if (status.requiresFullLogin) {
    return NextResponse.json({
      ...status,
      message: "Please sign in again to continue.",
    });
  }

  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "heartbeat");

  if (action === "lock") {
    await markSessionLocked(userId);
    return NextResponse.json({ ok: true, locked: true });
  }

  await touchSessionActivity(userId);
  const deviceToken = await getDeviceTokenFromCookies();
  const status = await evaluateSessionStatus({ userId, deviceToken });

  return NextResponse.json({ ok: true, ...status });
}

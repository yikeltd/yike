import { NextResponse } from "next/server";
import { getRequestMeta } from "@/lib/auth/session-state";
import {
  evaluatePinLoginGate,
  pinLoginGateToJson,
} from "@/lib/auth/pin-login-gate";
import {
  ensureDeviceToken,
  getDeviceTokenFromCookies,
} from "@/lib/auth/trusted-device";

export const runtime = "nodejs";

/** Resolve whether PIN quick sign-in is allowed on this device before showing the pad. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body.identifier ?? body.email ?? "").trim();

  if (!identifier) {
    return NextResponse.json({ error: "Missing account identifier" }, { status: 400 });
  }

  const { ip, userAgent } = await getRequestMeta(request);
  const deviceToken =
    (await getDeviceTokenFromCookies()) ?? (await ensureDeviceToken());

  const gate = await evaluatePinLoginGate({
    identifier,
    deviceToken,
    ip,
    userAgent,
  });

  return NextResponse.json(pinLoginGateToJson(gate));
}

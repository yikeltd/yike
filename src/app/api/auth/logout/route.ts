import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import {
  DEVICE_COOKIE,
  getDeviceTokenFromCookies,
  revokeTrustedDeviceForToken,
} from "@/lib/auth/trusted-device";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const body = (await request.json().catch(() => ({}))) as { revokeDevice?: boolean };

  if (body.revokeDevice) {
    const user = await getSession();
    const deviceToken = await getDeviceTokenFromCookies();
    if (user?.id && deviceToken) {
      await revokeTrustedDeviceForToken(user.id, deviceToken);
    }
  }

  // 1. Sign out on Supabase server-side
  try {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut({ scope: "global" });
    }
  } catch {
    /* Best-effort server signout */
  }

  // 2. Explicitly clear all session, PIN unlock, device, and auth cookies
  const cookiesToClear = [
    "yike_app_unlock",
    "yike_trusted_device",
    "yike_session",
    "sb-access-token",
    "sb-refresh-token",
  ];

  // Also match any Supabase project-specific auth cookies (sb-*-auth-token)
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name === DEVICE_COOKIE) {
      continue;
    }
    if (
      cookie.name.startsWith("sb-") ||
      cookie.name.startsWith("yike_") ||
      cookiesToClear.includes(cookie.name)
    ) {
      try {
        cookieStore.set(cookie.name, "", {
          path: "/",
          expires: new Date(0),
          maxAge: 0,
        });
      } catch {
        /* ignore cookie write errors */
      }
    }
  }

  return NextResponse.json({ ok: true });
}

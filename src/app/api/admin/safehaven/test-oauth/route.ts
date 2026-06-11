import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSafeHavenConfig,
  isSafeHavenConfigured,
} from "@/lib/providers/safehaven/config";
import { getSafeHavenAccessToken, clearSafeHavenTokenCache } from "@/lib/providers/safehaven/oauth";
import { writeSafeHavenProviderLog } from "@/lib/providers/safehaven/logging";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  if (!isSafeHavenConfigured()) {
    return NextResponse.json({
      ok: false,
      code: "provider_not_configured",
      error: "Safe Haven is awaiting credentials or disabled.",
    });
  }

  const config = getSafeHavenConfig();
  const started = Date.now();
  clearSafeHavenTokenCache();

  const token = await getSafeHavenAccessToken(config);
  const admin = createAdminClient();

  if (admin) {
    await writeSafeHavenProviderLog(admin, {
      action: "safehaven_oauth_started",
      status: token ? "success" : "failed",
      durationMs: Date.now() - started,
      errorCode: token ? null : "provider_auth_failed",
      errorMessage: token ? null : "OAuth token exchange failed",
    });
  }

  if (!token) {
    return NextResponse.json({
      ok: false,
      code: "provider_auth_failed",
      error: "OAuth token exchange failed. Check Safe Haven credentials.",
    });
  }

  return NextResponse.json({
    ok: true,
    tokenType: token.tokenType,
    expiresAt: new Date(token.expiresAt).toISOString(),
  });
}

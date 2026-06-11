import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeHavenConfigured } from "@/lib/providers/safehaven/config";
import { getSafeHavenAccountBalance } from "@/lib/providers/safehaven/client";
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

  const started = Date.now();
  const result = await getSafeHavenAccountBalance();
  const admin = createAdminClient();

  if (admin) {
    await writeSafeHavenProviderLog(admin, {
      action: "safehaven_health_check",
      status: result.ok ? "success" : "failed",
      durationMs: Date.now() - started,
      errorCode: result.ok ? null : result.code,
      errorMessage: result.ok ? null : result.error,
    });
  }

  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      code: result.code,
      error: result.error,
    });
  }

  return NextResponse.json({ ok: true });
}

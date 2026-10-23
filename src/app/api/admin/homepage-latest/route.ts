import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { requireServerClient } from "@/lib/supabase/require-client";
import {
  getLatestOnYikeConfig,
  setLatestOnYikeConfig,
  resolveLatestOnYikeFeed,
} from "@/lib/home/latest-on-yike.server";
import {
  validateLatestOnYikeConfigPatch,
  type LatestOnYikeConfig,
} from "@/lib/home/latest-on-yike-config";
import { isSampleListingFixtureEnabled } from "@/lib/sample-listings/flags";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = await getLatestOnYikeConfig();
  const supabase = await requireServerClient();
  const preview = await resolveLatestOnYikeFeed({
    supabase,
    fetchFailed: false,
    sampleFixtureMode: isSampleListingFixtureEnabled(),
  });

  return NextResponse.json({
    config,
    preview: preview.items,
    preview_meta: {
      usedSampleFixture: preview.usedSampleFixture,
      unavailableManualCount: preview.unavailableManualCount,
      error: preview.error,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as LatestOnYikeConfig;
  const validated = validateLatestOnYikeConfigPatch(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  await setLatestOnYikeConfig(validated.config, auth.user.id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "homepage_latest.update",
    target_type: "platform_settings",
    target_id: "homepage_latest_on_yike",
    metadata: {
      mode: validated.config.mode,
      totalLimit: validated.config.totalLimit,
      manualCount: validated.config.manualListingIds.length,
    },
    ip,
  });

  const supabase = await requireServerClient();
  const preview = await resolveLatestOnYikeFeed({
    supabase,
    fetchFailed: false,
    sampleFixtureMode: isSampleListingFixtureEnabled(),
  });

  return NextResponse.json({
    ok: true,
    config: validated.config,
    preview: preview.items,
    preview_meta: {
      usedSampleFixture: preview.usedSampleFixture,
      unavailableManualCount: preview.unavailableManualCount,
    },
  });
}

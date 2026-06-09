import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { repairAllMissingProfiles } from "@/lib/auth/profile-repair";
import { createVerifiedAdminClient, probeSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const admin = await createVerifiedAdminClient();
  if (!admin) {
    const diagnostics = await probeSupabaseAdmin();
    return NextResponse.json(
      {
        error:
          "Supabase service role cannot access auth admin. Check service role key/project match.",
        diagnostics: {
          serviceRolePresent: diagnostics.serviceRolePresent,
          supabaseUrlPresent: diagnostics.supabaseUrlPresent,
          authAdminReachable: diagnostics.authAdminReachable,
          profilesReachable: diagnostics.profilesReachable,
        },
      },
      { status: 503 }
    );
  }

  const result = await repairAllMissingProfiles(admin);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "user.profile_repair_bulk",
    target_type: "system",
    metadata: result,
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true, ...result });
}

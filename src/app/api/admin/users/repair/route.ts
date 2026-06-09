import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { repairUserProfile } from "@/lib/auth/profile-repair";
import { createVerifiedAdminClient, probeSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

  let body: { userId?: string; email?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await repairUserProfile(admin, {
    userId: body.userId,
    email: body.email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "user.profile_repair",
    target_type: "profile",
    target_id: result.userId,
    metadata: { created: result.created },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({
    ok: true,
    userId: result.userId,
    created: result.created,
  });
}

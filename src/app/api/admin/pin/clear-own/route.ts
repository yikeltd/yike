import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

/**
 * Clear the caller's own admin PIN so they can set a fresh one.
 * Lex session is the gate — admin PIN is step-up confirmation only.
 * POST /api/admin/pin/clear-own
 */
export async function POST() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ admin_pin_hash: null })
    .eq("id", auth.user.id);

  if (error) {
    console.error("[admin/pin/clear-own] update failed:", error.message);
    return NextResponse.json(
      { error: "Could not clear PIN. Sign in again and retry." },
      { status: 500 }
    );
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "pin.admin_clear_own",
    target_type: "profile",
    target_id: auth.user.id,
    ip,
  });

  return NextResponse.json({ ok: true, hasAdminPin: false });
}

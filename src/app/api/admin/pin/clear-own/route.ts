import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/admin/audit";

/**
 * Clear the caller's own admin PIN.
 * Prefer setup with replaceForgotten=true (one step). This remains for recovery.
 */
export async function POST() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let cleared = false;

  const userClient = await createClient();
  if (userClient) {
    const { error: rpcError } = await userClient.rpc("yike_clear_own_admin_pin");
    if (!rpcError) cleared = true;
    else console.error("[admin/pin/clear-own] rpc failed:", rpcError.message);
  }

  if (!cleared) {
    let admin;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { data, error } = await admin
      .from("profiles")
      .update({ admin_pin_hash: null })
      .eq("id", auth.user.id)
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      console.error("[admin/pin/clear-own] update failed:", error?.message);
      return NextResponse.json(
        {
          error:
            "Could not clear PIN. Use “I forgot my PIN”, enter a new PIN, and save — that replaces it in one step.",
        },
        { status: 500 }
      );
    }
  }

  try {
    const admin = createAdminClient();
    const { data: check } = await admin
      .from("profiles")
      .select("admin_pin_hash")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (check?.admin_pin_hash) {
      return NextResponse.json(
        {
          error:
            "PIN is still set. Use “I forgot my PIN”, choose a new PIN, and save to replace it.",
        },
        { status: 500 }
      );
    }
  } catch {
    /* verification best-effort */
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

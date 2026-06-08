import { NextResponse } from "next/server";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VERIFICATION_STATE_LABELS } from "@/lib/verification/status-states";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const isUuid = /^[0-9a-f-]{36}$/i.test(q);
  let query = admin
    .from("profiles")
    .select(
      "id, full_name, email, username, role, verification_state, adaptive_trust_level, verification_required, operational_suspicion_score"
    )
    .limit(20);

  if (isUuid) {
    query = query.eq("id", q);
  } else if (q.includes("@")) {
    query = query.ilike("email", `%${q}%`);
  } else {
    query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data ?? []).map((row) => ({
    id: row.id as string,
    name: (row.full_name as string) || (row.username as string) || "User",
    email: row.email as string | null,
    role: row.role as string,
    verificationState: row.verification_state as string,
    verificationStateLabel:
      VERIFICATION_STATE_LABELS[row.verification_state as keyof typeof VERIFICATION_STATE_LABELS] ??
      row.verification_state,
    trustLevel: row.adaptive_trust_level ?? 0,
    verificationRequired: Boolean(row.verification_required),
    suspicionScore: row.operational_suspicion_score ?? 0,
  }));

  return NextResponse.json({ users });
}

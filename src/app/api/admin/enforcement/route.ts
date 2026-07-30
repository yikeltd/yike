import { NextResponse } from "next/server";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyEnforcementAction, EnforcementLevel } from "@/lib/trust-safety/enforcement";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const body = (await req.json()) as {
    userId: string;
    action: EnforcementLevel | "restore";
    reason: string;
    notes?: string;
  };

  if (!body.userId || !body.action || !body.reason) {
    return NextResponse.json(
      { error: "Missing required fields: userId, action, reason" },
      { status: 400 }
    );
  }

  try {
    const result = await applyEnforcementAction(admin, {
      userId: body.userId,
      action: body.action,
      moderatorId: auth.user.id,
      reason: body.reason,
      notes: body.notes,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to execute enforcement action";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

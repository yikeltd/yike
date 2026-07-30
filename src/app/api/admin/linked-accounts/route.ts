import { NextResponse } from "next/server";
import { requireTrustEnforcementApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyEnforcementAction } from "@/lib/trust-safety/enforcement";
import { logTrustAudit } from "@/lib/trust-safety/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireTrustEnforcementApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: pairs, error } = await admin
    .from("linked_accounts")
    .select("*, primary_user:primary_user_id(id, full_name, email, avatar_url), linked_user:linked_user_id(id, full_name, email, avatar_url)")
    .order("confidence_score", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pairs });
}

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
    pairId: string;
    action: "confirm" | "dismiss" | "restrict_linked";
    notes?: string;
  };

  if (!body.pairId || !body.action) {
    return NextResponse.json({ error: "pairId and action required" }, { status: 400 });
  }

  const { data: pair, error: fetchErr } = await admin
    .from("linked_accounts")
    .select("*")
    .eq("id", body.pairId)
    .single();

  if (fetchErr || !pair) {
    return NextResponse.json({ error: "Linked account pair not found" }, { status: 404 });
  }

  const newStatus = body.action === "confirm" ? "confirmed" : body.action === "dismiss" ? "dismissed" : "confirmed";

  await admin
    .from("linked_accounts")
    .update({
      status: newStatus,
      moderator_notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.pairId);

  if (body.action === "restrict_linked") {
    // Restrict the linked secondary account
    await applyEnforcementAction(admin, {
      userId: pair.linked_user_id,
      action: "restricted",
      moderatorId: auth.user.id,
      reason: `Linked Account Action: Confirmed connection to restricted account ${pair.primary_user_id}`,
      notes: body.notes,
    });
  }

  await logTrustAudit(admin, {
    actorId: auth.user.id,
    targetUserId: pair.linked_user_id,
    action: `linked_account_${body.action}`,
    details: { primary_user_id: pair.primary_user_id, notes: body.notes },
  });

  return NextResponse.json({ success: true, status: newStatus });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { creditYikeCoins, debitYikeCoins } from "@/lib/yike-coins/ledger";

export const runtime = "nodejs";

type AdjustBody = {
  userId?: string;
  direction?: "credit" | "debit";
  amountCoins?: number;
  reason?: string;
  reference?: string;
};

export async function POST(request: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: AdjustBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  const direction = body.direction;
  const amountCoins = body.amountCoins;
  const reason = body.reason?.trim();
  const reference = body.reference?.trim();

  if (!userId || !direction || !reference || !reason) {
    return NextResponse.json(
      { error: "userId, direction, amountCoins, reason, and reference are required" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(amountCoins) || (amountCoins ?? 0) <= 0) {
    return NextResponse.json({ error: "amountCoins must be a positive integer" }, { status: 400 });
  }

  if (direction !== "credit" && direction !== "debit") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const idempotencyKey = `admin_adjust:${reference}`;

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const result =
    direction === "credit"
      ? await (async () => {
          const { executeAdminYcGrant } = await import("@/lib/yike-coins/transfer");
          const grant = await executeAdminYcGrant(admin, {
            actorId: auth.user.id,
            recipientId: userId,
            amountCoins: amountCoins!,
            reason,
            idempotencyKey,
            grantReference: `ADM-${reference}`,
          });
          if (!grant.ok) return grant;
          return {
            ok: true as const,
            ledgerId: grant.ledgerId,
            balanceAfter: grant.balanceAfter,
            alreadyApplied: grant.alreadyApplied,
          };
        })()
      : await debitYikeCoins({
          userId,
          amountCoins: amountCoins!,
          reference: `ADM-${reference}`,
          idempotencyKey,
          serviceCode: null,
          reason: `Admin adjustment: ${reason}`,
          metadata: {
            admin_actor_id: auth.user.id,
            adjustment_reference: reference,
          },
        });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  void writeAuditLogAsync({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: direction === "credit" ? "yike_coin_admin_credit" : "yike_coin_admin_debit",
    target_type: "profile",
    target_id: userId,
    metadata: {
      amount_coins: amountCoins,
      reason,
      reference,
      ledger_id: result.ledgerId,
      already_applied: result.alreadyApplied,
    },
  });

  return NextResponse.json({
    ledgerId: result.ledgerId,
    balanceAfter: result.balanceAfter,
    alreadyApplied: result.alreadyApplied,
  });
}

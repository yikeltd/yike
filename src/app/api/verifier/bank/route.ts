import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { logAuthSecurityEvent } from "@/lib/auth/security-events";
import {
  parseSensitiveConfirmationToken,
  requireSensitiveConfirmation,
} from "@/lib/auth/require-sensitive-confirmation";
import { getRequestMeta } from "@/lib/auth/session-state";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { isValidAccountNumber, resolveBankByCode } from "@/lib/ambassador/nigerian-banks";

export const runtime = "nodejs";

async function getVerifier(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("field_verifiers")
    .select("id, payout_enabled")
    .eq("profile_id", userId)
    .maybeSingle();
  return data;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const verifier = await getVerifier(user.id);
  if (!verifier) return NextResponse.json({ error: "Not a field verifier" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const gate = requireSensitiveConfirmation(
    parseSensitiveConfirmationToken(body),
    user.id,
    "change_payout_bank"
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: 401 });
  }

  const bank = resolveBankByCode(String(body.bankCode ?? ""));
  const accountNumber = String(body.accountNumber ?? "").trim();
  const accountName = String(body.accountName ?? "").trim();

  if (!bank) return NextResponse.json({ error: "Select a valid commercial bank" }, { status: 400 });
  if (!isValidAccountNumber(accountNumber)) {
    return NextResponse.json({ error: "Account number must be 10 digits" }, { status: 400 });
  }
  if (!accountName) return NextResponse.json({ error: "Account name required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: existing } = await admin
    .from("field_verifier_bank_details")
    .select("account_number, bank_code")
    .eq("verifier_id", verifier.id)
    .maybeSingle();

  const isChange =
    existing &&
    (existing.account_number !== accountNumber || existing.bank_code !== bank.code);
  const now = new Date().toISOString();

  await admin.from("field_verifier_bank_details").upsert({
    verifier_id: verifier.id,
    bank_name: bank.name,
    bank_code: bank.code,
    account_number: accountNumber,
    account_name: accountName,
    bank_change_pending_review: true,
    previous_account_number: isChange ? existing.account_number : null,
    updated_at: now,
  });

  await admin
    .from("field_verifiers")
    .update({
      payout_enabled: false,
      bank_change_pending_review: true,
      payout_hold_reason: "Bank details pending admin review",
      updated_at: now,
    })
    .eq("id", verifier.id);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: user.id,
    actor_role: "user",
    action: "verifier.bank.changed",
    target_type: "field_verifier",
    target_id: verifier.id,
    metadata: { bankCode: bank.code, isChange: Boolean(isChange) },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  const { ip, userAgent } = await getRequestMeta(request);
  await logAuthSecurityEvent({
    userId: user.id,
    eventType: "bank_change.confirmed",
    metadata: { scope: "field_verifier" },
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    message: "Bank saved. Payouts paused until admin review.",
  });
}

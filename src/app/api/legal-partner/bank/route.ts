import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { isValidAccountNumber, resolveBankByCode } from "@/lib/ambassador/nigerian-banks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: partner } = await admin
    .from("legal_partners")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!partner) return NextResponse.json({ error: "Not a legal partner" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const bank = resolveBankByCode(String(body.bankCode ?? ""));
  const accountNumber = String(body.accountNumber ?? "").trim();
  const accountName = String(body.accountName ?? "").trim();

  if (!bank) return NextResponse.json({ error: "Select a valid commercial bank" }, { status: 400 });
  if (!isValidAccountNumber(accountNumber)) {
    return NextResponse.json({ error: "Account number must be 10 digits" }, { status: 400 });
  }
  if (!accountName) return NextResponse.json({ error: "Account name required" }, { status: 400 });

  const { data: existing } = await admin
    .from("legal_partner_bank_details")
    .select("account_number, bank_code")
    .eq("partner_id", partner.id)
    .maybeSingle();

  const isChange =
    existing &&
    (existing.account_number !== accountNumber || existing.bank_code !== bank.code);

  await admin.from("legal_partner_bank_details").upsert({
    partner_id: partner.id,
    bank_name: bank.name,
    bank_code: bank.code,
    account_number: accountNumber,
    account_name: accountName,
    bank_change_pending_review: true,
    previous_account_number: isChange ? existing.account_number : null,
    updated_at: new Date().toISOString(),
  });

  await admin
    .from("legal_partners")
    .update({
      payout_enabled: false,
      bank_change_pending_review: true,
      payout_hold_reason: "Bank details pending admin review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", partner.id);

  const hdrs = await headers();
  await writeAuditLog({
    actor_id: user.id,
    actor_role: "user",
    action: "legal_partner.bank.changed",
    target_type: "legal_partner",
    target_id: partner.id,
    metadata: { bankCode: bank.code },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });

  return NextResponse.json({ ok: true, message: "Bank saved. Payouts paused until admin review." });
}

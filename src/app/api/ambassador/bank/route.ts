import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import {
  isValidAccountNumber,
  resolveBankByCode,
} from "@/lib/ambassador/nigerian-banks";

export const runtime = "nodejs";

async function getAmbassador(userId: string) {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("city_ambassadors")
    .select("id, payout_enabled, bank_change_pending_review")
    .eq("profile_id", userId)
    .maybeSingle();
  return data;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const ambassador = await getAmbassador(user.id);
  if (!ambassador) return NextResponse.json({ error: "Not an ambassador" }, { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    ?.from("ambassador_bank_details")
    .select(
      "bank_name, bank_code, account_number, account_name, updated_at, bank_change_pending_review"
    )
    .eq("ambassador_id", ambassador.id)
    .maybeSingle() ?? { data: null };

  if (!data) {
    return NextResponse.json({
      bank: null,
      payoutEnabled: ambassador.payout_enabled,
      bankChangePendingReview: ambassador.bank_change_pending_review,
    });
  }

  const masked = data.account_number.replace(/\d(?=\d{4})/g, "*");
  return NextResponse.json({
    bank: {
      bankName: data.bank_name,
      bankCode: data.bank_code,
      accountNumber: masked,
      accountName: data.account_name,
      updatedAt: data.updated_at,
      pendingReview: data.bank_change_pending_review,
    },
    payoutEnabled: ambassador.payout_enabled,
    bankChangePendingReview: ambassador.bank_change_pending_review,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const ambassador = await getAmbassador(user.id);
  if (!ambassador) return NextResponse.json({ error: "Not an ambassador" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const bankCode = String(body.bankCode ?? "").trim();
  const accountNumber = String(body.accountNumber ?? "").trim();
  const accountName = String(body.accountName ?? "").trim();

  const bank = resolveBankByCode(bankCode);
  if (!bank) {
    return NextResponse.json({ error: "Select a valid Nigerian commercial bank" }, { status: 400 });
  }

  if (!accountName || accountName.length < 3) {
    return NextResponse.json({ error: "Account name is required" }, { status: 400 });
  }

  if (!isValidAccountNumber(accountNumber)) {
    return NextResponse.json({ error: "Account number must be exactly 10 digits" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: existing } = await admin
    .from("ambassador_bank_details")
    .select("account_number, bank_code")
    .eq("ambassador_id", ambassador.id)
    .maybeSingle();

  const now = new Date().toISOString();
  const isChange =
    existing &&
    (existing.account_number !== accountNumber || existing.bank_code !== bank.code);

  await admin.from("ambassador_bank_details").upsert({
    ambassador_id: ambassador.id,
    bank_name: bank.name,
    bank_code: bank.code,
    account_number: accountNumber,
    account_name: accountName,
    bank_change_pending_review: isChange ? true : (existing ? false : true),
    previous_account_number: isChange ? existing.account_number : null,
    updated_at: now,
  });

  await admin
    .from("city_ambassadors")
    .update({
      payout_enabled: false,
      bank_change_pending_review: true,
      payout_hold_reason: isChange
        ? "Bank details changed — pending admin review"
        : "Initial bank setup — pending admin review",
      updated_at: now,
    })
    .eq("id", ambassador.id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: user.id,
    actor_role: "user",
    action: "ambassador.bank.changed",
    target_type: "city_ambassador",
    target_id: ambassador.id,
    metadata: {
      bankCode: bank.code,
      bankName: bank.name,
      isChange: Boolean(isChange),
    },
    ip,
  });

  return NextResponse.json({
    ok: true,
    payoutFrozen: true,
    message:
      "Bank details saved. Payouts are paused until the Yike team reviews your account.",
  });
}

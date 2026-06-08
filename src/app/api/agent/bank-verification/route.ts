import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAgentRole } from "@/lib/agent-tiers";
import {
  listNigerianBanks,
  normalizeAccountNumber,
  resolveBankAccountName,
} from "@/lib/verification/bank";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ banks: listNigerianBanks() });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    bankName?: string;
    accountNumber?: string;
  };

  const bankName = String(body.bankName ?? "").trim();
  const accountNumber = normalizeAccountNumber(String(body.accountNumber ?? ""));

  const { data: profile } = await admin
    .from("profiles")
    .select("role, is_banned")
    .eq("id", user.id)
    .single();

  if (!profile || profile.is_banned || !isAgentRole(profile.role)) {
    return NextResponse.json({ error: "Agent account required" }, { status: 403 });
  }

  const resolved = await resolveBankAccountName({ bankName, accountNumber });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const { error } = await admin
    .from("profiles")
    .update({
      bank_name: bankName,
      bank_account_number: accountNumber,
      bank_account_resolved_name: resolved.accountName,
      bank_verified: false,
      bank_verified_at: null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not save bank details" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    accountName: resolved.accountName,
    message: "Bank details saved. Yike will verify before payouts or premium trust.",
  });
}

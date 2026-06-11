import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SellerVerificationStatus } from "@/types/database";

export const runtime = "nodejs";

const STATUSES: SellerVerificationStatus[] = [
  "pending",
  "under_review",
  "approved",
  "rejected",
];

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() as SellerVerificationStatus | undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  let query = admin
    .from("seller_verifications")
    .select(
      `
      *,
      user:profiles!seller_verifications_user_id_fkey (
        id, full_name, company_name, username, account_type, agent_type, seller_verification_level
      ),
      payment:payment_orders!seller_verifications_payment_order_id_fkey (
        id, reference, status, amount, paid_at
      )
    `
    )
    .eq("verification_level", "business")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (status && STATUSES.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ verifications: data ?? [] });
}

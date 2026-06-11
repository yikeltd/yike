import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PropertyVerificationOrderStatus } from "@/types/database";

export const runtime = "nodejs";

const TABS: Record<string, PropertyVerificationOrderStatus[]> = {
  paid: ["paid"],
  assigned: ["assigned"],
  in_progress: ["in_progress"],
  completed: ["completed"],
  cancelled: ["cancelled", "refunded"],
};

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
  const tab = url.searchParams.get("tab") ?? "paid";
  const statuses = TABS[tab] ?? TABS.paid;

  const { data, error } = await admin
    .from("property_verification_orders")
    .select(
      `
      *,
      user:profiles!property_verification_orders_user_id_fkey (
        id, full_name, email
      ),
      request:property_verification_requests!property_verification_orders_request_id_fkey (
        id, request_reference, property_title, property_location_text, buyer_full_name, buyer_whatsapp, is_diaspora_request
      ),
      property:properties!property_verification_orders_property_id_fkey (
        id, title, city, area
      )
    `
    )
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    orders: data ?? [],
    tabs: Object.keys(TABS).map((id) => ({
      id,
      label: id.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  });
}

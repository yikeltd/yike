import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { isApprovedListingForPublicMetrics } from "@/lib/listing-analytics/public-listing-target";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  if (!(await isApprovedListingForPublicMetrics(admin, id))) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { error } = await admin.rpc("increment_property_views", {
    property_id: id,
  });

  if (error) {
    return NextResponse.json({ error: "Could not track view" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

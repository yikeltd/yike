import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { suggestHotPickListings } from "@/lib/admin/entity-search";

export const runtime = "nodejs";

/** Recommended listings for hot picks — scored for engagement, trust, and quality. */
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
  const excludeParam = String(url.searchParams.get("exclude") ?? "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 12), 20);
  const excludeIds = excludeParam
    ? excludeParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  try {
    const suggestions = await suggestHotPickListings(admin, excludeIds, limit);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Suggestions failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireDealMatchingApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  searchAgentsForDeal,
  suggestAgentsForDeal,
} from "@/lib/deal-matching/agent-suggestions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const auth = await requireDealMatchingApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const city = url.searchParams.get("city");
  const state = url.searchParams.get("state");
  const area = url.searchParams.get("area");
  const propertyType = url.searchParams.get("property_type");

  if (q) {
    const agents = await searchAgentsForDeal(admin, q);
    return NextResponse.json({ agents });
  }

  const agents = await suggestAgentsForDeal(admin, {
    city,
    state,
    area,
    propertyType,
    limit: 20,
  });

  return NextResponse.json({ agents });
}

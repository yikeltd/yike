import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAdminEntitiesByIds,
  searchAdminEntities,
  type AdminEntityType,
} from "@/lib/admin/entity-search";

export const runtime = "nodejs";

const VALID_TYPES = new Set<AdminEntityType>([
  "listing",
  "user",
  "agent",
  "company",
  "staff",
  "verifier",
  "ambassador",
  "legal_partner",
]);

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
  const type = String(url.searchParams.get("type") ?? "") as AdminEntityType;
  const q = String(url.searchParams.get("q") ?? "").trim();
  const idsParam = String(url.searchParams.get("ids") ?? "").trim();
  const excludeParam = String(url.searchParams.get("exclude") ?? "").trim();
  const status = url.searchParams.get("status") ?? undefined;
  const verified = url.searchParams.get("verified") === "1";
  const city = url.searchParams.get("city") ?? undefined;
  const propertyType = url.searchParams.get("property_type") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 15), 30);

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  try {
    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const results = await fetchAdminEntitiesByIds(admin, type, ids);
      return NextResponse.json({ results });
    }

    const excludeIds = excludeParam
      ? excludeParam.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const results = await searchAdminEntities(admin, type, q, {
      limit,
      excludeIds,
      listingFilters: {
        status,
        verified,
        city,
        property_type: propertyType,
      },
      profileFilters: { verified, city },
    });

    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

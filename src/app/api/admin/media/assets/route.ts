import { NextResponse } from "next/server";
import { requireTechApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Staff-only: list recent protected media assets. */
export async function GET(request: Request) {
  const auth = await requireTechApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const listingId = url.searchParams.get("listingId")?.trim() || null;
  const ownerId = url.searchParams.get("ownerId")?.trim() || null;
  const sha256 = url.searchParams.get("sha256")?.trim() || null;
  const phash = url.searchParams.get("phash")?.trim() || null;
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 40)));

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  let query = admin
    .from("media_assets")
    .select(
      "id, image_uuid, owner_id, listing_id, listing_ref, marketplace, seller_name, company_name, watermark_label, created_at, sha256, phash, dhash, ahash, original_width, original_height, processed_width, processed_height, watermark_version, pipeline_version, media_version, path_thumbnail, path_medium, path_large, path_original, index_in_listing, bytes_original, bytes_large, protection_enabled, metadata"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (listingId) query = query.eq("listing_id", listingId);
  if (ownerId) query = query.eq("owner_id", ownerId);
  if (sha256) query = query.eq("sha256", sha256);
  if (phash) query = query.eq("phash", phash);

  const { data, error } = await query;
  if (error) {
    console.error("[admin/media/assets]", error.message);
    return NextResponse.json({ error: "Could not load media assets" }, { status: 500 });
  }

  return NextResponse.json({ assets: data ?? [] });
}

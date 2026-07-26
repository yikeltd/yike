import { NextResponse } from "next/server";
import { requireTechApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_PROTECTION_ARCHIVE_BUCKET } from "@/lib/media/protection";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Staff-only: single media asset + short-lived signed original URL. */
export async function GET(_request: Request, context: Ctx) {
  const auth = await requireTechApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin/media/assets/id]", error.message);
    return NextResponse.json({ error: "Could not load asset" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let originalSignedUrl: string | null = null;
  if (data.path_original) {
    const { data: signed, error: signError } = await admin.storage
      .from(data.storage_bucket_archive || MEDIA_PROTECTION_ARCHIVE_BUCKET)
      .createSignedUrl(data.path_original, 60 * 10);
    if (signError) {
      console.error("[admin/media/assets/id] signed url", signError.message);
    } else {
      originalSignedUrl = signed?.signedUrl ?? null;
    }
  }

  return NextResponse.json({
    asset: data,
    originalSignedUrl,
  });
}

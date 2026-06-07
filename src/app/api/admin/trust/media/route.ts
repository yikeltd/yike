import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTrustMediaSignedUrl } from "@/lib/trust/operations/media-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const bucket = String(body.bucket ?? "legal");
  const path = String(body.path ?? "").trim();

  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const result = await createTrustMediaSignedUrl(admin, { bucket, path });
  if (!result.url) {
    return NextResponse.json({ error: result.error ?? "Could not sign URL" }, { status: 500 });
  }

  return NextResponse.json({ url: result.url, expiresIn: 3600 });
}

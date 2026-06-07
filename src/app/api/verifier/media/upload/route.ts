import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeUploadedImage } from "@/lib/media/image";
import { ALLOWED_IMAGE_TYPES } from "@/lib/media/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: verifier } = await admin
    .from("field_verifiers")
    .select("id, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!verifier || verifier.status !== "approved") {
    return NextResponse.json({ error: "Not an active verifier" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const requestId = String(form.get("requestId") ?? "").trim();

  if (!file || !requestId) {
    return NextResponse.json({ error: "File and requestId required" }, { status: 400 });
  }

  const { data: assignment } = await admin
    .from("property_verification_requests")
    .select("id")
    .eq("id", requestId)
    .eq("assigned_verifier_id", verifier.id)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeUploadedImage(buffer);
  const index = Date.now();
  const base = `verification-reports/${verifier.id}/${requestId}/img-${index}`;
  const bucket = "property-media";

  const { error } = await supabase.storage.from(bucket).upload(`${base}-large.webp`, optimized.large, {
    contentType: "image/webp",
    upsert: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(`${base}-large.webp`);
  return NextResponse.json({ url: urlData.publicUrl, optimized: true });
}

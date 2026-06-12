import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { optimizeUploadedImage } from "@/lib/media/image";
import { ALLOWED_IMAGE_TYPES } from "@/lib/media/constants";
import { friendlyStorageError } from "@/lib/media/storage-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_MS = 60_000;

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("verification_status, phone_verified, email_verified")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (status === "approved" || status === "verified") {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }
  if (status === "pending") {
    return NextResponse.json({ error: "Application under review" }, { status: 409 });
  }

  const { data: recent } = await admin
    .from("agent_verifications")
    .select("submitted_at")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    recent?.submitted_at &&
    Date.now() - new Date(recent.submitted_at).getTime() < RATE_MS
  ) {
    return NextResponse.json(
      { error: "Please wait a minute before uploading again" },
      { status: 429 }
    );
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (
    !file ||
    !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)
  ) {
    return NextResponse.json({ error: "Upload a JPG or PNG selfie" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const optimized = await optimizeUploadedImage(buffer);
  const storagePath = `verification/${user.id}/selfie-lg.webp`;

  const { error: uploadError } = await admin.storage
    .from("agent-documents")
    .upload(storagePath, optimized.large, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: friendlyStorageError(uploadError.message) },
      { status: 500 }
    );
  }

  const { data: urlData } = admin.storage
    .from("agent-documents")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    ok: true,
    url: urlData.publicUrl,
  });
}

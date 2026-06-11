import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { compressPropertyPhoto } from "@/lib/images/compress-image";
import { buildStoragePaths, resolveImageMime } from "@/lib/media/image";
import { validateVideoUpload } from "@/lib/media/video";
import { ALLOWED_IMAGE_TYPES } from "@/lib/media/constants";
import { friendlyStorageError } from "@/lib/media/storage-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "property-media";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Supabase unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_banned")
    .eq("id", user.id)
    .single();

  const canUpload =
    profile &&
    !profile.is_banned &&
    ["agent", "agent_unverified", "agent_verified", "admin", "super_admin"].includes(
      profile.role
    );

  if (!canUpload) {
    return NextResponse.json({ error: "Verified listers only" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const propertyId = (form.get("propertyId") as string) || "draft";
  const index = Number(form.get("index") ?? 0);
  const kind = (form.get("kind") as string) || "image";
  const durationSec = form.get("duration")
    ? Number(form.get("duration"))
    : undefined;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = admin.storage;

  if (kind === "video") {
    const check = validateVideoUpload(buffer, file.type, durationSec);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const path = `properties/${propertyId}/video-${index}.mp4`;
    const { error } = await storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
    if (error) {
      return NextResponse.json(
        { error: friendlyStorageError(error.message) },
        { status: 500 }
      );
    }
    const { data: urlData } = storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({
      url: urlData.publicUrl,
      optimized: false,
      note: "Video stored; H.264 worker compresses when enabled.",
    });
  }

  const mime = resolveImageMime(file, buffer);

  if (
    !mime ||
    !ALLOWED_IMAGE_TYPES.includes(mime as (typeof ALLOWED_IMAGE_TYPES)[number])
  ) {
    return NextResponse.json(
      { error: "This photo format is not supported. Please upload JPG, PNG, or WebP." },
      { status: 400 }
    );
  }

  try {
    const optimized = await compressPropertyPhoto(buffer);
    const paths = buildStoragePaths(propertyId, index);

    const uploads = [
      await storage.from(BUCKET).upload(paths.thumbnail, optimized.thumbnail, {
        contentType: "image/webp",
        upsert: true,
      }),
      await storage.from(BUCKET).upload(paths.medium, optimized.medium, {
        contentType: "image/webp",
        upsert: true,
      }),
      await storage.from(BUCKET).upload(paths.large, optimized.large, {
        contentType: "image/webp",
        upsert: true,
      }),
    ];

    const failed = uploads.find((u) => u.error);
    if (failed?.error) {
      console.error("[media/upload] storage upload failed", {
        bucket: BUCKET,
        propertyId,
        mime,
        message: failed.error.message,
      });
      return NextResponse.json(
        { error: friendlyStorageError(failed.error.message) },
        { status: 500 }
      );
    }

    const { data: largeUrl } = storage.from(BUCKET).getPublicUrl(paths.large);
    const { data: mediumUrl } = storage.from(BUCKET).getPublicUrl(paths.medium);
    const { data: thumbUrl } = storage.from(BUCKET).getPublicUrl(paths.thumbnail);

    return NextResponse.json({
      url: largeUrl.publicUrl,
      medium: mediumUrl.publicUrl,
      thumbnail: thumbUrl.publicUrl,
      blur_data_url: optimized.blurDataUrl,
      width: optimized.originalWidth,
      height: optimized.originalHeight,
      small_warning: optimized.smallSource,
      optimized: true,
      format: "webp",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed — try again";
    console.error("[media/upload] image processing failed", {
      propertyId,
      mime,
      message,
    });
    return NextResponse.json({ error: friendlyStorageError(message) }, { status: 400 });
  }
}

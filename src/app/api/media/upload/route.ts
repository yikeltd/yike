import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { optimizeUploadedImage, buildStoragePaths } from "@/lib/media/image";
import { validateVideoUpload } from "@/lib/media/video";
import { ALLOWED_IMAGE_TYPES } from "@/lib/media/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const supabase = await createClient();
  if (!supabase) {
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

  if (
    !profile ||
    profile.is_banned ||
    !["agent", "admin", "super_admin"].includes(profile.role)
  ) {
    return NextResponse.json({ error: "Agents only" }, { status: 403 });
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

  if (kind === "video") {
    const check = validateVideoUpload(buffer, file.type, durationSec);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const path = `properties/${propertyId}/video-${index}.mp4`;
    const { error } = await supabase.storage
      .from("property-media")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { data: urlData } = supabase.storage
      .from("property-media")
      .getPublicUrl(path);
    return NextResponse.json({
      url: urlData.publicUrl,
      optimized: false,
      note: "Video stored; H.264 worker compresses when enabled.",
    });
  }

  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
    )
  ) {
    return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
  }

  try {
    const optimized = await optimizeUploadedImage(buffer);
    const paths = buildStoragePaths(propertyId, index);
    const bucket = "property-media";

    const uploads = await Promise.all([
      supabase.storage.from(bucket).upload(paths.thumbnail, optimized.thumbnail, {
        contentType: "image/webp",
        upsert: true,
      }),
      supabase.storage.from(bucket).upload(paths.medium, optimized.medium, {
        contentType: "image/webp",
        upsert: true,
      }),
      supabase.storage.from(bucket).upload(paths.large, optimized.large, {
        contentType: "image/webp",
        upsert: true,
      }),
    ]);

    const failed = uploads.find((u) => u.error);
    if (failed?.error) {
      return NextResponse.json({ error: failed.error.message }, { status: 500 });
    }

    const { data: largeUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(paths.large);
    const { data: mediumUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(paths.medium);
    const { data: thumbUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(paths.thumbnail);

    return NextResponse.json({
      url: largeUrl.publicUrl,
      medium: mediumUrl.publicUrl,
      thumbnail: thumbUrl.publicUrl,
      optimized: true,
      format: "webp",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Optimization failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

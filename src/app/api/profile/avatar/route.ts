import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { optimizeUploadedImage, buildAvatarStoragePaths } from "@/lib/media/image";
import { ALLOWED_IMAGE_TYPES } from "@/lib/media/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WebP photo" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let optimized;
  try {
    optimized = await optimizeUploadedImage(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not process image";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const paths = buildAvatarStoragePaths(user.id);
  const bucket = "property-media";

  for (const [key, path] of Object.entries(paths) as [
    keyof typeof paths,
    string,
  ][]) {
    const body =
      key === "thumbnail"
        ? optimized.thumbnail
        : key === "medium"
          ? optimized.medium
          : optimized.large;
    const { error } = await supabase.storage.from(bucket).upload(path, body, {
      contentType: "image/webp",
      upsert: true,
    });
    if (error) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(paths.medium);
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Could not save profile photo" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatarUrl });
}

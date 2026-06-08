import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrustedAdminClient } from "@/lib/supabase/admin";
import { optimizeUploadedImage, buildAvatarStoragePaths, resolveImageMime } from "@/lib/media/image";
import { WEBP_CONTENT_TYPE } from "@/lib/media/constants";
import { friendlyStorageError } from "@/lib/media/storage-errors";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
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
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP photo" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = resolveImageMime(file, buffer);
    if (!mime) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP photo" }, { status: 400 });
    }

    let optimized;
    try {
      optimized = await optimizeUploadedImage(buffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not process image";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const admin = await getTrustedAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Photo upload is temporarily unavailable. Try again shortly." },
        { status: 503 }
      );
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
      const { error } = await admin.storage.from(bucket).upload(path, body, {
        contentType: WEBP_CONTENT_TYPE,
        upsert: true,
      });
      if (error) {
        return NextResponse.json(
          { error: friendlyStorageError(error.message) },
          { status: 500 }
        );
      }
    }

    const { data: urlData } = admin.storage.from(bucket).getPublicUrl(paths.medium);
    const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Could not save profile photo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, avatarUrl });
  } catch (err) {
    console.error("[profile/avatar]", err);
    return NextResponse.json(
      { error: "Photo upload is temporarily unavailable. Try again shortly." },
      { status: 500 }
    );
  }
}

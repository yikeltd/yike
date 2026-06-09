import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrustedAdminClient } from "@/lib/supabase/admin";
import {
  assertAvatarOutputSize,
  optimizeUploadedImage,
  buildAvatarStoragePaths,
  resolveImageMime,
} from "@/lib/media/image";
import { logUserProfileMedia } from "@/lib/profile/media-audit";
import { uploadProfileImageVariants } from "@/lib/profile/media-storage";
import type { UserRole } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROFILE_SAVE_ERROR = "We couldn't save this photo right now. Please try again.";

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
      assertAvatarOutputSize(optimized);
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
    const uploaded = await uploadProfileImageVariants(admin, paths, {
      thumbnail: optimized.thumbnail,
      medium: optimized.medium,
      large: optimized.large,
    });
    if (!uploaded.ok) {
      return NextResponse.json({ error: uploaded.error }, { status: 500 });
    }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: uploaded.publicUrl })
      .eq("id", user.id);

    if (profileError) {
      console.error("[profile/avatar] profile update failed:", profileError.message);
      return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
    }

    logUserProfileMedia(user.id, (profileRow?.role ?? "user") as UserRole, "profile.avatar.upload");

    return NextResponse.json({ ok: true, avatarUrl: uploaded.publicUrl });
  } catch (err) {
    console.error("[profile/avatar]", err);
    return NextResponse.json(
      { error: "Photo upload is temporarily unavailable. Try again shortly." },
      { status: 500 }
    );
  }
}

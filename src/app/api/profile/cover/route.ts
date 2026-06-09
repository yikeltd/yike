import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrustedAdminClient } from "@/lib/supabase/admin";
import {
  buildCoverStoragePaths,
  optimizeCoverImage,
  resolveImageMime,
} from "@/lib/media/image";
import { PROFILE_MEDIA_LIMITS } from "@/lib/media/constants";
import { logUserProfileMedia } from "@/lib/profile/media-audit";
import { removeProfileImageVariants, uploadProfileImageVariants } from "@/lib/profile/media-storage";
import type { UserRole } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROFILE_SAVE_ERROR = "We couldn't save this cover right now. Please try again.";

function parseFocalY(raw: FormDataEntryValue | null): number {
  const n = Number(typeof raw === "string" ? raw : NaN);
  if (!Number.isFinite(n)) return PROFILE_MEDIA_LIMITS.coverFocalDefault;
  return Math.max(0, Math.min(100, Math.round(n)));
}

async function getAuthedProfile() {
  const supabase = await createClient();
  if (!supabase) return { error: NextResponse.json({ error: "Unavailable" }, { status: 503 }) };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, role: (profile?.role ?? "user") as UserRole };
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedProfile();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user, role } = auth;

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP photo" }, { status: 400 });
    }

    const focalY = parseFocalY(form.get("focal_y"));
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = resolveImageMime(file, buffer);
    if (!mime) {
      return NextResponse.json({ error: "Upload a JPG, PNG, or WebP photo" }, { status: 400 });
    }

    let optimized;
    try {
      optimized = await optimizeCoverImage(buffer, focalY);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not process image";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const admin = await getTrustedAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Cover upload is temporarily unavailable. Try again shortly." },
        { status: 503 }
      );
    }

    const paths = buildCoverStoragePaths(user.id);
    const uploaded = await uploadProfileImageVariants(admin, paths, {
      thumbnail: optimized.thumbnail,
      medium: optimized.medium,
      large: optimized.large,
    });
    if (!uploaded.ok) {
      return NextResponse.json({ error: uploaded.error }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        cover_url: uploaded.publicUrl,
        cover_position_y: focalY,
        company_cover_url: uploaded.publicUrl,
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("[profile/cover] profile update failed:", profileError.message);
      return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
    }

    logUserProfileMedia(user.id, role, "profile.cover.upload", { focal_y: focalY });

    return NextResponse.json({
      ok: true,
      coverUrl: uploaded.publicUrl,
      coverPositionY: focalY,
    });
  } catch (err) {
    console.error("[profile/cover]", err);
    return NextResponse.json(
      { error: "Cover upload is temporarily unavailable. Try again shortly." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthedProfile();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user, role } = auth;

    const body = (await request.json()) as { focal_y?: number };
    const focalY = Math.max(
      0,
      Math.min(100, Math.round(body.focal_y ?? PROFILE_MEDIA_LIMITS.coverFocalDefault))
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("cover_url, company_cover_url")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.cover_url && !profile?.company_cover_url) {
      return NextResponse.json({ error: "No cover image to reposition" }, { status: 400 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ cover_position_y: focalY })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
    }

    logUserProfileMedia(user.id, role, "profile.cover.reposition", { focal_y: focalY });

    return NextResponse.json({ ok: true, coverPositionY: focalY });
  } catch (err) {
    console.error("[profile/cover] PATCH", err);
    return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthedProfile();
    if ("error" in auth && auth.error) return auth.error;
    const { supabase, user, role } = auth;

    const admin = await getTrustedAdminClient();
    if (admin) {
      const paths = Object.values(buildCoverStoragePaths(user.id));
      await removeProfileImageVariants(admin, paths);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        cover_url: null,
        company_cover_url: null,
        cover_position_y: PROFILE_MEDIA_LIMITS.coverFocalDefault,
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
    }

    logUserProfileMedia(user.id, role, "profile.cover.remove");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile/cover] DELETE", err);
    return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
  }
}

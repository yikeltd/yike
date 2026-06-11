import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTrustedAdminClient } from "@/lib/supabase/admin";
import { compressProfileCover } from "@/lib/images/compress-image";
import {
  buildCoverStoragePaths,
  resolveImageMime,
} from "@/lib/media/image";
import { PROFILE_MEDIA_LIMITS } from "@/lib/media/constants";
import { logUserProfileMedia } from "@/lib/profile/media-audit";
import {
  removeProfileImageVariants,
  uploadProfileImageVariants,
} from "@/lib/profile/media-storage";
import type { UserRole } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROFILE_SAVE_ERROR = "We couldn't save this cover right now. Please try again.";
const COVER_SCHEMA_MISSING_ERROR =
  "Profile cover schema is missing. Apply migration 20250721100000_profile_cover_support.sql.";

type ProfileWriteResult =
  | { ok: true; coverPositionPersisted: boolean }
  | { ok: false; error: string };

function isMissingCoverColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error?.message) return false;
  const message = error.message.toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    (message.includes("schema cache") &&
      (message.includes("cover_url") || message.includes("cover_position_y"))) ||
    message.includes("column profiles.cover_url does not exist") ||
    message.includes("column profiles.cover_position_y does not exist") ||
    message.includes("could not find the 'cover_url' column") ||
    message.includes("could not find the 'cover_position_y' column")
  );
}

function logProfileCoverWriteFailure(
  action: string,
  error: { code?: string; message?: string; details?: string; hint?: string } | null
) {
  console.error(`[profile/cover] ${action} failed:`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });
}

async function saveCoverProfileFields(
  admin: SupabaseClient,
  userId: string,
  coverUrl: string,
  focalY: number
): Promise<ProfileWriteResult> {
  const { error } = await admin
    .from("profiles")
    .update({
      cover_url: coverUrl,
      cover_position_y: focalY,
      company_cover_url: coverUrl,
    })
    .eq("id", userId);

  if (!error) return { ok: true, coverPositionPersisted: true };

  if (!isMissingCoverColumnError(error)) {
    logProfileCoverWriteFailure("profile update", error);
    return { ok: false, error: PROFILE_SAVE_ERROR };
  }

  console.error("[profile/cover] cover schema missing:", COVER_SCHEMA_MISSING_ERROR);
  const fallback = await admin
    .from("profiles")
    .update({ company_cover_url: coverUrl })
    .eq("id", userId);

  if (fallback.error) {
    logProfileCoverWriteFailure("legacy company_cover_url update", fallback.error);
    return { ok: false, error: PROFILE_SAVE_ERROR };
  }

  return { ok: true, coverPositionPersisted: false };
}

async function hasExistingCover(admin: SupabaseClient, userId: string): Promise<boolean> {
  const modern = await admin
    .from("profiles")
    .select("cover_url, company_cover_url")
    .eq("id", userId)
    .maybeSingle();

  if (!modern.error) {
    return Boolean(modern.data?.cover_url || modern.data?.company_cover_url);
  }
  if (!isMissingCoverColumnError(modern.error)) {
    logProfileCoverWriteFailure("cover lookup", modern.error);
    return false;
  }

  console.error("[profile/cover] cover lookup using legacy company_cover_url fallback");
  const legacy = await admin
    .from("profiles")
    .select("company_cover_url")
    .eq("id", userId)
    .maybeSingle();

  if (legacy.error) {
    logProfileCoverWriteFailure("legacy cover lookup", legacy.error);
    return false;
  }
  return Boolean(legacy.data?.company_cover_url);
}

async function saveCoverPosition(
  admin: SupabaseClient,
  userId: string,
  focalY: number
): Promise<ProfileWriteResult> {
  const { error } = await admin
    .from("profiles")
    .update({ cover_position_y: focalY })
    .eq("id", userId);

  if (!error) return { ok: true, coverPositionPersisted: true };

  if (isMissingCoverColumnError(error)) {
    console.error("[profile/cover] cover position cannot persist:", COVER_SCHEMA_MISSING_ERROR);
    return { ok: true, coverPositionPersisted: false };
  }

  logProfileCoverWriteFailure("cover position update", error);
  return { ok: false, error: PROFILE_SAVE_ERROR };
}

async function clearCoverProfileFields(
  admin: SupabaseClient,
  userId: string
): Promise<ProfileWriteResult> {
  const { error } = await admin
    .from("profiles")
    .update({
      cover_url: null,
      company_cover_url: null,
      cover_position_y: PROFILE_MEDIA_LIMITS.coverFocalDefault,
    })
    .eq("id", userId);

  if (!error) return { ok: true, coverPositionPersisted: true };

  if (!isMissingCoverColumnError(error)) {
    logProfileCoverWriteFailure("cover clear", error);
    return { ok: false, error: PROFILE_SAVE_ERROR };
  }

  console.error("[profile/cover] cover clear using legacy company_cover_url fallback");
  const fallback = await admin
    .from("profiles")
    .update({ company_cover_url: null })
    .eq("id", userId);

  if (fallback.error) {
    logProfileCoverWriteFailure("legacy cover clear", fallback.error);
    return { ok: false, error: PROFILE_SAVE_ERROR };
  }

  return { ok: true, coverPositionPersisted: false };
}

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

  return { user, role: (profile?.role ?? "user") as UserRole };
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthedProfile();
    if ("error" in auth && auth.error) return auth.error;
    const { user, role } = auth;

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
      optimized = await compressProfileCover(buffer, focalY);
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

    const profileWrite = await saveCoverProfileFields(admin, user.id, uploaded.publicUrl, focalY);
    if (!profileWrite.ok) {
      await removeProfileImageVariants(admin, Object.values(paths));
      return NextResponse.json({ error: profileWrite.error }, { status: 500 });
    }

    logUserProfileMedia(user.id, role, "profile.cover.upload", {
      focal_y: focalY,
      cover_position_persisted: profileWrite.coverPositionPersisted,
    });

    return NextResponse.json({
      ok: true,
      coverUrl: uploaded.publicUrl,
      coverPositionY: focalY,
      coverPositionPersisted: profileWrite.coverPositionPersisted,
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
    const { user, role } = auth;

    const admin = await getTrustedAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Cover upload is temporarily unavailable. Try again shortly." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { focal_y?: number };
    const focalY = Math.max(
      0,
      Math.min(100, Math.round(body.focal_y ?? PROFILE_MEDIA_LIMITS.coverFocalDefault))
    );

    if (!(await hasExistingCover(admin, user.id))) {
      return NextResponse.json({ error: "No cover image to reposition" }, { status: 400 });
    }

    const profileWrite = await saveCoverPosition(admin, user.id, focalY);
    if (!profileWrite.ok) {
      return NextResponse.json({ error: profileWrite.error }, { status: 500 });
    }

    logUserProfileMedia(user.id, role, "profile.cover.reposition", {
      focal_y: focalY,
      cover_position_persisted: profileWrite.coverPositionPersisted,
    });

    return NextResponse.json({
      ok: true,
      coverPositionY: focalY,
      coverPositionPersisted: profileWrite.coverPositionPersisted,
    });
  } catch (err) {
    console.error("[profile/cover] PATCH", err);
    return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthedProfile();
    if ("error" in auth && auth.error) return auth.error;
    const { user, role } = auth;

    const admin = await getTrustedAdminClient();
    const paths = Object.values(buildCoverStoragePaths(user.id));
    await removeProfileImageVariants(admin, paths);

    const profileWrite = await clearCoverProfileFields(admin, user.id);
    if (!profileWrite.ok) {
      return NextResponse.json({ error: profileWrite.error }, { status: 500 });
    }

    logUserProfileMedia(user.id, role, "profile.cover.remove");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile/cover] DELETE", err);
    return NextResponse.json({ error: PROFILE_SAVE_ERROR }, { status: 500 });
  }
}

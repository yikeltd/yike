import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { compressPropertyPhoto } from "@/lib/images/compress-image";
import { buildStoragePaths, resolveImageMime } from "@/lib/media/image";
import { validateVideoUpload } from "@/lib/media/video";
import { ALLOWED_IMAGE_TYPES, MEDIA_LIMITS } from "@/lib/media/constants";
import { friendlyStorageError } from "@/lib/media/storage-errors";
import {
  isMediaProtectionEnabled,
  protectListingImage,
  persistMediaAsset,
} from "@/lib/media/protection";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "property-media";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STAFF_ROLES = new Set([
  "admin",
  "super_admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
]);

/**
 * Resolve a safe storage folder key.
 * - draft → scoped under the authenticated user (prevents cross-user overwrite)
 * - UUID → must own the listing (or be staff)
 */
async function resolveStoragePropertyId(params: {
  rawPropertyId: string;
  userId: string;
  role: string;
  admin: ReturnType<typeof createAdminClient>;
}): Promise<
  | { ok: true; storageId: string; listingId: string | null }
  | { ok: false; status: number; error: string }
> {
  const raw = params.rawPropertyId.trim() || "draft";

  if (raw === "draft") {
    return { ok: true, storageId: `draft/${params.userId}`, listingId: null };
  }

  if (!UUID_RE.test(raw)) {
    return { ok: false, status: 400, error: "Invalid property id" };
  }

  const { data: property, error } = await params.admin
    .from("properties")
    .select("id, agent_id")
    .eq("id", raw)
    .maybeSingle();

  if (error) {
    console.error("[media/upload] property lookup failed", error.message);
    return { ok: false, status: 500, error: "Could not verify listing ownership" };
  }

  if (!property) {
    return { ok: false, status: 404, error: "Listing not found" };
  }

  const isStaff = STAFF_ROLES.has(params.role);
  if (property.agent_id !== params.userId && !isStaff) {
    return { ok: false, status: 403, error: "Not allowed to upload for this listing" };
  }

  return { ok: true, storageId: raw, listingId: raw };
}

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
    .select("role, is_banned, full_name, company_name")
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
  const rawPropertyId = (form.get("propertyId") as string) || "draft";
  const index = Number(form.get("index") ?? 0);
  const kind = (form.get("kind") as string) || "image";
  const durationSec = form.get("duration")
    ? Number(form.get("duration"))
    : undefined;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const maxBytes =
    kind === "video" ? MEDIA_LIMITS.maxVideoUploadBytes : MEDIA_LIMITS.maxUploadBytes;
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        error:
          kind === "video"
            ? "Video is too large (max 15MB before compression)."
            : "Photo is too large (max 15MB before compression).",
      },
      { status: 400 }
    );
  }

  const ownership = await resolveStoragePropertyId({
    rawPropertyId,
    userId: user.id,
    role: profile.role,
    admin,
  });
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }
  const propertyId = ownership.storageId;

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    return NextResponse.json({ error: "File exceeds upload limit" }, { status: 400 });
  }

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
    const protectionOn = isMediaProtectionEnabled();

    if (protectionOn) {
      const protectedImage = await protectListingImage({
        buffer,
        profile: {
          full_name: profile.full_name,
          company_name: profile.company_name,
        },
        ownerId: user.id,
        listingRef: propertyId,
        listingId: ownership.listingId,
        index,
        mimeSource: mime,
      });

      const uploads = [
        await storage.from(BUCKET).upload(protectedImage.paths.thumbnail, protectedImage.thumbnail, {
          contentType: "image/webp",
          upsert: true,
        }),
        await storage.from(BUCKET).upload(protectedImage.paths.medium, protectedImage.medium, {
          contentType: "image/webp",
          upsert: true,
        }),
        await storage.from(BUCKET).upload(protectedImage.paths.large, protectedImage.large, {
          contentType: "image/webp",
          upsert: true,
        }),
      ];

      const failed = uploads.find((u) => u.error);
      if (failed?.error) {
        console.error("[media/upload] protected storage upload failed", {
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

      const archiveUpload = await storage
        .from(protectedImage.buckets.archive)
        .upload(protectedImage.paths.original, protectedImage.archiveBuffer, {
          contentType: mime,
          upsert: true,
        });
      if (archiveUpload.error) {
        // Public variants already published — log but do not fail the seller upload.
        console.error("[media/upload] archive original failed", archiveUpload.error.message);
      }

      const persisted = await persistMediaAsset(admin, {
        protected: protectedImage,
        ownerId: user.id,
        listingId: ownership.listingId,
        listingRef: propertyId,
        index,
        mimeSource: mime,
      });

      const { data: largeUrl } = storage.from(BUCKET).getPublicUrl(protectedImage.paths.large);
      const { data: mediumUrl } = storage.from(BUCKET).getPublicUrl(protectedImage.paths.medium);
      const { data: thumbUrl } = storage.from(BUCKET).getPublicUrl(protectedImage.paths.thumbnail);

      return NextResponse.json({
        url: largeUrl.publicUrl,
        medium: mediumUrl.publicUrl,
        thumbnail: thumbUrl.publicUrl,
        blur_data_url: protectedImage.blurDataUrl,
        width: protectedImage.originalWidth,
        height: protectedImage.originalHeight,
        small_warning: protectedImage.smallSource,
        optimized: true,
        format: "webp",
        protected: true,
        mediaAssetId: persisted?.id ?? null,
        imageUuid: protectedImage.imageUuid,
        watermarkLabel: protectedImage.watermarkLabel,
      });
    }

    // Legacy path (ENABLE_MEDIA_PROTECTION=false) — compress only, no watermark.
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
      protected: false,
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

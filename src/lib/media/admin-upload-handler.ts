import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import {
  IMAGE_PRESET_SIZES,
  MEDIA_LIMITS,
  type ImagePreset,
} from "@/lib/media/constants";
import {
  optimizeImagePreset,
  readImageUploadBuffer,
  resolveImageMime,
} from "@/lib/media/image";
import { AD_CREATIVES_BUCKET, storeWebpObject } from "@/lib/media/store-webp";

const PRESETS = new Set(Object.keys(IMAGE_PRESET_SIZES));

function sanitizeFolder(raw: string): string {
  const folder = raw.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  return folder || "general";
}

export type AdminImageUploadOptions = {
  preset?: ImagePreset;
  folder?: string;
};

/** Admin image upload — always WebP via sharp. Used by all staff image uploads. */
export async function handleAdminImageUpload(
  request: Request,
  defaults: AdminImageUploadOptions = {}
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json(
      { error: "Server storage is not configured (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const form = await request.formData();
  const file = form.get("file") as File | null;
  const presetRaw = String(form.get("preset") ?? defaults.preset ?? "card");
  const preset = PRESETS.has(presetRaw) ? (presetRaw as ImagePreset) : "card";
  const folder = sanitizeFolder(
    String(form.get("folder") ?? defaults.folder ?? "uploads")
  );

  if (!file || !resolveImageMime(file)) {
    return NextResponse.json(
      { error: "Upload a JPG, PNG, WebP, or HEIC image" },
      { status: 400 }
    );
  }

  if (file.size > MEDIA_LIMITS.maxUploadBytes) {
    return NextResponse.json(
      {
        error: `Image must be under ${Math.round(MEDIA_LIMITS.maxUploadBytes / 1024 / 1024)}MB`,
      },
      { status: 400 }
    );
  }

  let buffer: Buffer;
  try {
    buffer = await readImageUploadBuffer(file);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid image";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let processed;
  try {
    processed = await optimizeImagePreset(buffer, preset);
  } catch {
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const path = `${folder}/${preset}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

  try {
    const stored = await storeWebpObject(
      admin.storage,
      AD_CREATIVES_BUCKET,
      path,
      processed.buffer
    );
    return NextResponse.json({
      imageUrl: stored.publicUrl,
      path: stored.path,
      format: "webp",
      preset,
      width: processed.width,
      height: processed.height,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const hint =
      message.toLowerCase().includes("bucket") ||
      message.toLowerCase().includes("not found")
        ? " — run migration ad_creatives_bucket on Supabase"
        : "";
    console.error("[admin/media/upload-image]", message);
    return NextResponse.json({ error: `${message}${hint}` }, { status: 500 });
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { WEBP_CONTENT_TYPE } from "@/lib/media/constants";
import { friendlyStorageError } from "@/lib/media/storage-errors";

export const PROFILE_IMAGES_BUCKET = "profile-images";

export async function uploadProfileImageVariants(
  admin: SupabaseClient,
  paths: { thumbnail: string; medium: string; large: string },
  bodies: { thumbnail: Buffer; medium: Buffer; large: Buffer }
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  for (const [key, path] of Object.entries(paths) as [
    keyof typeof paths,
    string,
  ][]) {
    const body = bodies[key];
    const { error } = await admin.storage.from(PROFILE_IMAGES_BUCKET).upload(path, body, {
      contentType: WEBP_CONTENT_TYPE,
      upsert: true,
    });
    if (error) {
      console.error("[profile-media] storage upload failed:", {
        bucket: PROFILE_IMAGES_BUCKET,
        path,
        message: error.message,
      });
      return { ok: false, error: friendlyStorageError(error.message) };
    }
  }

  const { data: urlData } = admin.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(paths.medium);

  return { ok: true, publicUrl: `${urlData.publicUrl}?v=${Date.now()}` };
}

export async function removeProfileImageVariants(
  admin: SupabaseClient,
  paths: string[]
): Promise<void> {
  if (!paths.length) return;
  await admin.storage.from(PROFILE_IMAGES_BUCKET).remove(paths);
}

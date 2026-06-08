import { handleAdminImageUpload } from "@/lib/media/admin-upload-handler";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Admin image upload — compresses every file to WebP (preset: square|card|banner|strip). */
export async function POST(request: Request) {
  return handleAdminImageUpload(request);
}

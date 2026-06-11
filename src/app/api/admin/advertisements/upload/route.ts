import { handleAdminImageUpload } from "@/lib/media/admin-upload-handler";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  return handleAdminImageUpload(request, { preset: "banner", folder: "sponsored" });
}

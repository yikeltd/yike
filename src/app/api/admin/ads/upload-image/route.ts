import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { handleAdminImageUpload } from "@/lib/media/admin-upload-handler";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Email ad chip uploads — square 80×80 WebP. */
export async function POST(request: Request) {
  const auth = await requireAdminApi();
  const res = await handleAdminImageUpload(request, { preset: "square", folder: "email" });

  if (auth.ok && res.ok) {
    const cloned = res.clone();
    const data = (await cloned.json()) as { path?: string; preset?: string };
    const ctx = await getRequestAuditContext("/lex/auth/email-ads");

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "ad_creative.upload",
      target_type: "ad_creative",
      target_id: data.path,
      metadata: { preset: data.preset, folder: "email" },
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });
  }

  return res;
}

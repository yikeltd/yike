import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireSuperAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { getReviewPublishingMode, setReviewPublishingMode } from "@/lib/platform-settings";
import type { ReviewPublishingMode } from "@/types/database";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const mode = await getReviewPublishingMode();
  return NextResponse.json({ review_publishing_mode: mode });
}

export async function PATCH(req: Request) {
  const auth = await requireSuperAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const body = (await req.json()) as { review_publishing_mode?: ReviewPublishingMode };
  if (
    body.review_publishing_mode !== "manual_review" &&
    body.review_publishing_mode !== "auto_publish"
  ) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  await setReviewPublishingMode(body.review_publishing_mode, auth.user.id);

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "settings.update",
    target_type: "platform_settings",
    target_id: "review_publishing_mode",
    metadata: { mode: body.review_publishing_mode },
    ip,
  });

  return NextResponse.json({ ok: true, review_publishing_mode: body.review_publishing_mode });
}

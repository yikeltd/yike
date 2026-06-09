import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLog } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";
import { getTrustedAdminClient } from "@/lib/supabase/admin";
import { buildAvatarStoragePaths, buildCoverStoragePaths } from "@/lib/media/image";
import { PROFILE_MEDIA_LIMITS } from "@/lib/media/constants";
import { removeProfileImageVariants } from "@/lib/profile/media-storage";

type MediaKind = "avatar" | "cover";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: profileId } = await params;
  const body = (await req.json()) as { kind?: MediaKind; reason?: string };
  const kind = body.kind;
  const reason = body.reason?.trim() || "Removed by admin";

  if (kind !== "avatar" && kind !== "cover") {
    return NextResponse.json({ error: "Invalid media kind" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, cover_url, company_cover_url")
    .eq("id", profileId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const admin = await getTrustedAdminClient();
  if (admin) {
    const paths =
      kind === "avatar"
        ? Object.values(buildAvatarStoragePaths(profileId))
        : Object.values(buildCoverStoragePaths(profileId));
    await removeProfileImageVariants(admin, paths);
  }

  const update =
    kind === "avatar"
      ? { avatar_url: null }
      : {
          cover_url: null,
          company_cover_url: null,
          cover_position_y: PROFILE_MEDIA_LIMITS.coverFocalDefault,
        };

  const { error } = await supabase.from("profiles").update(update).eq("id", profileId);
  if (error) {
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }

  const h = await headers();
  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: kind === "avatar" ? "admin.profile.avatar.remove" : "admin.profile.cover.remove",
    target_type: "profile",
    target_id: profileId,
    target_user_id: profileId,
    target_user_name: profile.full_name ?? profile.username,
    reason,
    metadata: {
      previous_url:
        kind === "avatar"
          ? profile.avatar_url
          : profile.cover_url ?? profile.company_cover_url,
    },
    route: h.get("x-pathname") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}

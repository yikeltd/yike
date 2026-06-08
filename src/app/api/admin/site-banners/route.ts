import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { hasValidPinSession } from "@/lib/admin/pin";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type BannerPayload = {
  title?: string | null;
  message?: string;
  image_url?: string | null;
  link_url?: string | null;
  priority?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  placement?: string;
};

type BannerAction =
  | { action: "create"; payload: BannerPayload }
  | { action: "update"; id: string; payload: BannerPayload }
  | { action: "delete"; id: string; reason?: string }
  | { action: "restore"; id: string; reason?: string }
  | { action: "toggle"; id: string; is_active: boolean };

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as BannerAction;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const ctx = await getRequestAuditContext("/lex/auth/banners");
  const now = new Date().toISOString();

  if (body.action === "create") {
    const { data, error } = await supabase
      .from("site_banners")
      .insert({
        ...body.payload,
        placement: body.payload.placement ?? "mobile_header",
      })
      .select("id, title")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "site_banner.create",
      target_type: "site_banner",
      target_id: data.id,
      metadata: { title: data.title },
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true, id: data.id });
  }

  if (body.action === "update") {
    await supabase.from("site_banners").update(body.payload).eq("id", body.id);

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "site_banner.update",
      target_type: "site_banner",
      target_id: body.id,
      metadata: body.payload as Record<string, unknown>,
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle") {
    await supabase
      .from("site_banners")
      .update({ is_active: body.is_active })
      .eq("id", body.id);

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "site_banner.update",
      target_type: "site_banner",
      target_id: body.id,
      metadata: { is_active: body.is_active },
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    const pinValid = await hasValidPinSession(auth.user.id);
    if (!pinValid) {
      return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
    }

    await supabase
      .from("site_banners")
      .update({
        is_active: false,
        archived_at: now,
        archived_by: auth.user.id,
      })
      .eq("id", body.id);

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "site_banner.delete",
      target_type: "site_banner",
      target_id: body.id,
      reason: body.reason,
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "restore") {
    await supabase
      .from("site_banners")
      .update({
        archived_at: null,
        archived_by: null,
      })
      .eq("id", body.id);

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "site_banner.restore",
      target_type: "site_banner",
      target_id: body.id,
      reason: body.reason,
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

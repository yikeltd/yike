import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import { getRequestAuditContext } from "@/lib/admin/request-context";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type HotPickAction =
  | { action: "create"; property_id: string; title?: string; badge?: string }
  | { action: "toggle"; id: string; is_active: boolean }
  | { action: "delete"; id: string; reason?: string }
  | { action: "reorder"; items: { id: string; sort_order: number }[] };

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await req.json()) as HotPickAction;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const ctx = await getRequestAuditContext("/lex/auth/hot-picks");
  const now = new Date().toISOString();

  if (body.action === "create") {
    const { data: maxRow } = await supabase
      .from("home_hot_picks")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: property } = await supabase
      .from("properties")
      .select("id, title, city")
      .eq("id", body.property_id)
      .maybeSingle();

    const { error } = await supabase.from("home_hot_picks").insert({
      property_id: body.property_id,
      title: body.title?.trim() || null,
      badge: body.badge?.trim() || "Hot pick",
      sort_order: (maxRow?.sort_order ?? -1) + 1,
      is_active: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "hot_pick.create",
      target_type: "hot_pick",
      target_id: body.property_id,
      metadata: { title: property?.title, city: property?.city },
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle") {
    await supabase
      .from("home_hot_picks")
      .update({ is_active: body.is_active })
      .eq("id", body.id);

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "hot_pick.update",
      target_type: "hot_pick",
      target_id: body.id,
      metadata: { is_active: body.is_active },
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    await supabase
      .from("home_hot_picks")
      .update({
        is_active: false,
        archived_at: now,
        archived_by: auth.user.id,
      })
      .eq("id", body.id);

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "hot_pick.delete",
      target_type: "hot_pick",
      target_id: body.id,
      reason: body.reason,
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "reorder") {
    for (const item of body.items) {
      await supabase
        .from("home_hot_picks")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id);
    }

    writeAuditLogAsync({
      actor_id: auth.user.id,
      actor_role: auth.profile.role,
      action: "hot_pick.reorder",
      target_type: "hot_pick",
      metadata: { count: body.items.length },
      ip: ctx.ip,
      user_agent_hash: ctx.user_agent_hash,
      route: ctx.route,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireAdminApi } from "@/lib/admin/api-auth";
import { hasValidPinSession } from "@/lib/admin/pin";
import { writeAuditLog } from "@/lib/admin/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("admin_user_notes")
    .select("id, body, created_at, author:profiles!admin_user_notes_author_id_fkey(full_name)")
    .eq("target_user_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Could not load notes" }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pinValid = await hasValidPinSession(auth.user.id);
  if (!pinValid) {
    return NextResponse.json({ error: "Admin PIN required" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = (await req.json()) as { note?: string };
  const note = String(body.note ?? "").trim();

  if (!note || note.length > 2000) {
    return NextResponse.json({ error: "Note is required (max 2000 chars)" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("admin_user_notes")
    .insert({
      target_user_id: id,
      author_id: auth.user.id,
      body: note,
    })
    .select("id, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not save note" }, { status: 500 });
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim();

  await writeAuditLog({
    actor_id: auth.user.id,
    actor_role: auth.profile.role,
    action: "agent.note",
    target_type: "profile",
    target_id: id,
    metadata: { note_id: data.id },
    ip,
  });

  return NextResponse.json({ ok: true, note: data });
}

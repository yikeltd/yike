import { NextResponse } from "next/server";
import { getProfile, getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const unreadOnly = url.searchParams.get("unread") === "1";

  let q = supabase
    .from("user_notifications")
    .select("id, title, body, category, priority, action_label, action_url, read_at, created_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) q = q.is("read_at", null);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "Could not load notifications" }, { status: 500 });
  }

  const { count } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  return NextResponse.json({
    notifications: data ?? [],
    unreadCount: count ?? 0,
  });
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  let body: { id?: string; markAll?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (body.markAll) {
    await supabase
      .from("user_notifications")
      .update({ read_at: now })
      .eq("recipient_user_id", user.id)
      .is("read_at", null);
    return NextResponse.json({ ok: true });
  }

  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("id", id)
    .eq("recipient_user_id", user.id);

  return NextResponse.json({ ok: true });
}

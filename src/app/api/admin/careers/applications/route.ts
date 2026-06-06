import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdmin } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/careers/constants";

export const runtime = "nodejs";

async function requireAdminApi() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_banned")
    .eq("id", user.id)
    .single();
  if (!profile || profile.is_banned || !isAdmin(profile.role)) return null;
  return { supabase, userId: user.id };
}

export async function PATCH(request: Request) {
  const ctx = await requireAdminApi();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const status = body.status ? (String(body.status) as ApplicationStatus) : undefined;
  const note = body.note ? String(body.note).trim() : undefined;
  const markViewed = body.markViewed === true;

  if (!id) {
    return NextResponse.json({ error: "Application id required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) patch.status = status;
  if (markViewed) patch.viewed_at = new Date().toISOString();

  const { error } = await ctx.supabase
    .from("job_applications")
    .update(patch)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (note) {
    await ctx.supabase.from("application_notes").insert({
      application_id: id,
      admin_id: ctx.userId,
      note,
    });
  }

  return NextResponse.json({ ok: true });
}

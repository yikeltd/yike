import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdmin } from "@/lib/auth";
import type { FollowUpQuestion } from "@/lib/careers/follow-up/types";

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

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await ctx.supabase
    .from("career_follow_up_templates")
    .select("id, name, job_category, questions, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ ok: true, templates: data ?? [] });
}

export async function POST(request: Request) {
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

  const name = String(body.name ?? "").trim();
  const questions = body.questions as FollowUpQuestion[] | undefined;
  if (!name || !questions?.length) {
    return NextResponse.json({ error: "Name and questions required" }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from("career_follow_up_templates")
    .insert({
      name,
      job_category: body.jobCategory ? String(body.jobCategory) : null,
      questions,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

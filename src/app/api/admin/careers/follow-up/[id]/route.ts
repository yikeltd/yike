import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdmin } from "@/lib/auth";
import { writeAuditLogAsync } from "@/lib/admin/audit";
import type { FollowUpRecommendation } from "@/lib/careers/follow-up/types";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

async function requireAdminApi(request: Request) {
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
  return {
    supabase,
    userId: user.id,
    profile: { role: profile.role },
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  };
}

export async function PATCH(request: Request, { params }: Props) {
  const ctx = await requireAdminApi(request);
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.recommendation) {
    patch.recommendation = String(body.recommendation) as FollowUpRecommendation;
  }
  if (body.adminNotes !== undefined) patch.admin_notes = String(body.adminNotes).trim() || null;
  if (body.interviewNotes !== undefined) {
    patch.interview_notes = String(body.interviewNotes).trim() || null;
  }
  if (body.interviewLink !== undefined) {
    patch.interview_link = String(body.interviewLink).trim() || null;
  }
  if (body.interviewScheduledAt !== undefined) {
    patch.interview_scheduled_at = body.interviewScheduledAt
      ? String(body.interviewScheduledAt)
      : null;
  }
  if (body.applicationStatus) {
    const applicationId = String(body.applicationId ?? "").trim();
    if (applicationId) {
      await ctx.supabase
        .from("job_applications")
        .update({
          status: String(body.applicationStatus),
          updated_at: new Date().toISOString(),
          viewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (body.note) {
        await ctx.supabase.from("application_notes").insert({
          application_id: applicationId,
          admin_id: ctx.userId,
          note: String(body.note).trim(),
        });
      }

      void writeAuditLogAsync({
        actor_id: ctx.userId,
        actor_role: ctx.profile.role,
        action: "career.application.status",
        target_type: "job_application",
        target_id: applicationId,
        metadata: { status: body.applicationStatus },
        ip: ctx.ip,
      });
    }
  }

  const { error } = await ctx.supabase
    .from("career_follow_up_requests")
    .update(patch)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  void writeAuditLogAsync({
    actor_id: ctx.userId,
    actor_role: ctx.profile.role as import("@/types/database").UserRole,
    action: "career.follow_up.review",
    target_type: "career_follow_up_request",
    target_id: id,
    metadata: patch,
    ip: ctx.ip,
  });

  return NextResponse.json({ ok: true });
}

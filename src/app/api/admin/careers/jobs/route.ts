import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAdmin } from "@/lib/auth";
import {
  buildJobSlug,
  generateJobIntelligence,
} from "@/lib/careers/job-intelligence";
import type { JobType, RoleCategory } from "@/lib/careers/constants";

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
  return supabase;
}

export async function POST(request: Request) {
  const supabase = await requireAdminApi();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const department = String(body.department ?? "").trim();
  const location = String(body.location ?? "").trim();
  const category = String(body.category ?? "").trim() as RoleCategory;
  const jobType = String(body.jobType ?? "full_time").trim() as JobType;
  const shortDescription = String(body.shortDescription ?? "").trim();
  const responsibilities = String(body.responsibilities ?? "").trim();
  const requirements = String(body.requirements ?? "").trim();
  const publish = body.publish === true;

  if (!title || !department || !location || !shortDescription || !requirements) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const intelligence = generateJobIntelligence({
    title,
    department,
    category,
    location,
    requirements,
    shortDescription,
  });

  const salaryMin = body.salaryMin ? Number(body.salaryMin) : null;
  const salaryMax = body.salaryMax ? Number(body.salaryMax) : null;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      slug: buildJobSlug(title),
      title,
      department,
      category,
      location,
      job_type: jobType,
      salary_min: salaryMin,
      salary_max: salaryMax,
      short_description: shortDescription,
      responsibilities,
      requirements,
      role_questions: intelligence.role_questions,
      scoring_criteria: intelligence.scoring_criteria,
      required_skills: intelligence.required_skills,
      experience_level: intelligence.experience_level,
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create job" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, job: data });
}

export async function PATCH(request: Request) {
  const supabase = await requireAdminApi();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const id = String(body.id ?? "").trim();
  const status = body.status ? String(body.status) : undefined;
  if (!id) {
    return NextResponse.json({ error: "Job id required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) {
    patch.status = status;
    if (status === "published") patch.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("jobs").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

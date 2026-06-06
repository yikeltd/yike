import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CareerJobForm } from "@/components/admin/career-job-form";
import { adminPath } from "@/lib/admin-paths";
import type { JobRow } from "@/lib/careers/constants";
import { categoryLabel, jobTypeLabel } from "@/lib/careers/constants";

export default async function AdminCareersPage() {
  if (!isSupabaseConfigured()) {
    return <p className="text-sm text-muted">Connect Supabase to manage careers.</p>;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const jobs = (data ?? []) as JobRow[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Careers</h1>
          <p className="mt-2 text-sm text-muted">
            Publish roles and review applications — smart defaults handle the rest.
          </p>
        </div>
        <Link
          href={adminPath("careers/applications")}
          className="pressable rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold"
        >
          View applications →
        </Link>
      </div>

      <CareerJobForm />

      <div>
        <h2 className="text-lg font-bold text-navy">All roles ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-sm text-muted shadow-float">
            No jobs yet — publish your first role above.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl bg-white p-5 shadow-float"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{job.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {categoryLabel(job.category)} · {jobTypeLabel(job.job_type)} ·{" "}
                      {job.location}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Skills: {(job.required_skills as string[])?.slice(0, 4).join(", ")}
                      {(job.required_skills as string[])?.length > 4 ? "…" : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      job.status === "published"
                        ? "bg-gold/20 text-gold-dark"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                {job.status === "published" && (
                  <a
                    href={`/careers/${job.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-gold-dark hover:underline"
                  >
                    View public page ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

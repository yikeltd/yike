import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ApplicationActions } from "@/components/admin/application-actions";
import { adminPath } from "@/lib/admin-paths";
import type { ApplicationRow } from "@/lib/careers/constants";
import { statusLabel } from "@/lib/careers/constants";

type Props = {
  searchParams: Promise<{
    q?: string;
    job?: string;
    status?: string;
    score?: string;
  }>;
};

const TABS = [
  { key: "", label: "All" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "review", label: "Review" },
  { key: "low_priority", label: "Low score" },
  { key: "interview", label: "Interview" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-muted";
}

export default async function AdminApplicationsPage({ searchParams }: Props) {
  const sp = await searchParams;

  if (!isSupabaseConfigured()) {
    return <p className="text-sm text-muted">Connect Supabase to view applications.</p>;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  let query = supabase
    .from("job_applications")
    .select("*, jobs(title, slug, category, department)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (sp.status) query = query.eq("status", sp.status);
  if (sp.job) query = query.eq("job_id", sp.job);
  if (sp.score === "high") query = query.gte("score", 70);
  if (sp.score === "mid") query = query.gte("score", 60).lt("score", 70);
  if (sp.score === "low") query = query.lt("score", 60);

  const { data } = await query;
  let applications = (data ?? []) as ApplicationRow[];

  const q = sp.q?.trim().toLowerCase();
  if (q) {
    applications = applications.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.jobs?.title?.toLowerCase().includes(q)
    );
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title")
    .order("title");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={adminPath("careers")}
            className="text-xs text-muted hover:text-gold-dark"
          >
            ← Careers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">Applications</h1>
          <p className="mt-1 text-sm text-muted">
            {applications.length} applicant{applications.length === 1 ? "" : "s"} — all scores visible
          </p>
        </div>
      </div>

      <form className="flex flex-wrap gap-2" action={adminPath("careers/applications")}>
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search name, email, city…"
          className="min-w-[200px] flex-1 rounded-xl border border-navy/10 px-3 py-2 text-sm"
        />
        <select
          name="job"
          defaultValue={sp.job ?? ""}
          className="rounded-xl border border-navy/10 px-3 py-2 text-sm"
        >
          <option value="">All roles</option>
          {(jobs ?? []).map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <select
          name="score"
          defaultValue={sp.score ?? ""}
          className="rounded-xl border border-navy/10 px-3 py-2 text-sm"
        >
          <option value="">Any score</option>
          <option value="high">70%+</option>
          <option value="mid">60–69%</option>
          <option value="low">Below 60%</option>
        </select>
        <button
          type="submit"
          className="pressable rounded-xl bg-navy px-4 py-2 text-sm font-bold text-gold"
        >
          Filter
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const href =
            tab.key === ""
              ? adminPath("careers/applications")
              : `${adminPath("careers/applications")}?status=${tab.key}`;
          const active = (sp.status ?? "") === tab.key;
          return (
            <Link
              key={tab.key || "all"}
              href={href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                active ? "bg-gold text-navy" : "bg-white text-muted ring-1 ring-black/5"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-sm text-muted shadow-float">
          No applications match your filters.
        </p>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <article
              key={app.id}
              className="rounded-2xl bg-white p-5 shadow-float"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">{app.full_name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {app.jobs?.title ?? "Role"} · {app.years_experience} yrs · {app.city},{" "}
                    {app.state}
                  </p>
                  <p className="mt-1 text-xs text-muted">{app.email}</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${scoreColor(app.score)}`}>
                    {app.score}%
                  </p>
                  <p className="text-xs font-semibold text-muted">
                    {statusLabel(app.status)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <a
                  href={`https://wa.me/${app.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-gold/20 px-2 py-1 font-semibold text-navy"
                >
                  WhatsApp
                </a>
                {app.instagram && (
                  <a
                    href={app.instagram.startsWith("http") ? app.instagram : `https://instagram.com/${app.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-surface px-2 py-1 text-muted"
                  >
                    Instagram
                  </a>
                )}
                {app.tiktok && (
                  <a
                    href={app.tiktok.startsWith("http") ? app.tiktok : `https://tiktok.com/@${app.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-surface px-2 py-1 text-muted"
                  >
                    TikTok
                  </a>
                )}
                {app.github && (
                  <a
                    href={app.github.startsWith("http") ? app.github : `https://github.com/${app.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-surface px-2 py-1 text-muted"
                  >
                    GitHub
                  </a>
                )}
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-muted">{app.why_apply}</p>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-gold-dark">
                  Full application
                </summary>
                <div className="mt-2 space-y-2 text-sm text-muted">
                  <p>
                    <strong>Occupation:</strong> {app.current_occupation}
                  </p>
                  <p>
                    <strong>Education:</strong> {app.education_level} · {app.age_range}
                  </p>
                  {app.cv_url && (
                    <p>
                      <strong>CV:</strong>{" "}
                      <a href={app.cv_url} className="text-gold-dark underline" target="_blank" rel="noreferrer">
                        View
                      </a>
                    </p>
                  )}
                  {Object.entries(app.extra_answers ?? {}).map(([k, v]) => (
                    <p key={k}>
                      <strong>{k}:</strong> {v}
                    </p>
                  ))}
                  <p className="text-[11px]">
                    Score breakdown:{" "}
                    {Object.entries(app.score_breakdown ?? {})
                      .map(([k, v]) => `${k} ${v}`)
                      .join(" · ")}
                  </p>
                </div>
              </details>

              <div className="mt-4 border-t border-surface pt-4">
                <ApplicationActions applicationId={app.id} compact />
              </div>

              <p className="mt-2 text-[11px] text-muted">
                {new Date(app.created_at).toLocaleString("en-NG")}
                {app.viewed_at ? " · viewed" : " · new"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { JobRow } from "@/lib/careers/constants";
import { categoryLabel, jobTypeLabel } from "@/lib/careers/constants";
import { resolveJobContent } from "@/lib/careers/job-content";
import { RouteFallback } from "@/components/layout/route-fallback";
import { SITE_NAME } from "@/lib/constants";
import { MapPin, Briefcase, Clock } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

function linesToBullets(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, ""));
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)} / month`;
  if (min) return `From ${fmt(min)} / month`;
  return `Up to ${fmt(max!)} / month`;
}

async function getJob(slug: string): Promise<JobRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as JobRow | null;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: `Careers — ${SITE_NAME}` };
  return {
    title: `${job.title} — Careers — ${SITE_NAME}`,
    description: job.short_description,
  };
}

export default async function CareerJobPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) {
    return (
      <div className="pb-12">
        <RouteFallback
          title="Role not found"
          message="This job may have been filled or the link is outdated. See open roles below."
        />
        <div className="mx-auto max-w-3xl px-3 text-center lg:px-8">
          <Link
            href="/careers"
            className="text-sm font-bold text-gold-dark hover:underline"
          >
            ← View all open roles
          </Link>
        </div>
      </div>
    );
  }

  const { summary, responsibilities } = resolveJobContent(job);
  const requirements = linesToBullets(job.requirements);
  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div className="pb-12">
      <section className="bg-navy px-3 py-10 text-white lg:px-8 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <Link href="/careers" className="text-xs text-white/60 hover:text-gold">
            ← All careers
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gold">
            {categoryLabel(job.category)} · {job.department}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight lg:text-4xl">
            {job.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              <Briefcase className="h-3.5 w-3.5 text-gold" />
              {jobTypeLabel(job.job_type)}
            </span>
            {job.experience_level && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold capitalize">
                <Clock className="h-3.5 w-3.5 text-gold" />
                {job.experience_level} level
              </span>
            )}
            {salary && (
              <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold">
                {salary}
              </span>
            )}
          </div>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 lg:text-lg">
            {summary}
          </p>

          <Link
            href={`/careers/${job.slug}/apply`}
            className="pressable mt-8 inline-block rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-navy shadow-glow-gold"
          >
            Apply now — takes ~5 minutes
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-3 py-10 lg:px-8 lg:py-12">
        {(responsibilities.length > 0 || requirements.length > 0) && (
          <div className="space-y-10 rounded-2xl bg-white p-6 shadow-float ring-1 ring-black/[0.04] sm:p-8">
            {responsibilities.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy">What you&apos;ll do</h2>
                <ul className="mt-4 space-y-3">
                  {responsibilities.map((line) => (
                    <li
                      key={line}
                      className="flex gap-3 text-sm leading-relaxed text-foreground/90"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {responsibilities.length > 0 && requirements.length > 0 && (
              <hr className="border-navy/8" />
            )}

            {requirements.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy">What we&apos;re looking for</h2>
                <ul className="mt-4 space-y-3">
                  {requirements.map((line) => (
                    <li
                      key={line}
                      className="flex gap-3 text-sm leading-relaxed text-muted"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy/30" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {(job.required_skills?.length ?? 0) > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-navy">Skills that help</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(job.required_skills as string[]).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-navy"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 rounded-2xl bg-gradient-to-br from-gold/15 to-gold/5 p-6 ring-1 ring-gold/25">
          <p className="font-bold text-navy">Sound like you?</p>
          <p className="mt-1 text-sm text-muted">
            Short application, smart review, WhatsApp follow-up if shortlisted.
          </p>
          <Link
            href={`/careers/${job.slug}/apply`}
            className="pressable mt-4 inline-block rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy"
          >
            Start application
          </Link>
        </div>
      </div>
    </div>
  );
}

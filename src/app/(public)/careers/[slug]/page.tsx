import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { JobRow } from "@/lib/careers/constants";
import { categoryLabel, jobTypeLabel } from "@/lib/careers/constants";
import { SITE_NAME } from "@/lib/constants";

type Props = { params: Promise<{ slug: string }> };

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
  if (!job) notFound();

  const requirements = job.requirements
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="pb-12">
      <section className="bg-navy px-3 py-10 text-white lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/careers" className="text-xs text-white/60 hover:text-gold">
            ← All careers
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gold">
            {categoryLabel(job.category)} · {job.department}
          </p>
          <h1 className="mt-2 text-3xl font-bold lg:text-4xl">{job.title}</h1>
          <p className="mt-3 text-sm text-white/75">
            {job.location} · {jobTypeLabel(job.job_type)}
            {job.experience_level && ` · ${job.experience_level} level`}
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/90">
            {job.short_description}
          </p>
          <Link
            href={`/careers/${job.slug}/apply`}
            className="pressable mt-6 inline-block rounded-xl bg-gold px-6 py-3 text-sm font-bold text-navy"
          >
            Apply now — takes ~5 minutes
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-3 py-10 lg:px-8">
        <section>
          <h2 className="text-lg font-bold text-navy">What you&apos;ll do</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {job.short_description}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-navy">What we&apos;re looking for</h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
            {requirements.map((line) => (
              <li key={line}>{line.replace(/^[-•]\s*/, "")}</li>
            ))}
          </ul>
        </section>

        {(job.required_skills?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-lg font-bold text-navy">Skills that help</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(job.required_skills as string[]).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-navy"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-2xl bg-gold/10 p-6 ring-1 ring-gold/20">
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

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SITE_NAME } from "@/lib/constants";
import { PageHero } from "@/components/pages/page-hero";
import { CtaBanner } from "@/components/pages/cta-banner";
import { JobCard } from "@/components/careers/job-card";
import type { JobRow } from "@/lib/careers/constants";
import { PAGE_IMAGERY } from "@/constants/pageImagery";

export const metadata = {
  title: `Careers — ${SITE_NAME}`,
  description:
    "Join the team building a smarter real estate marketplace for millions of Nigerians.",
};

const WHY_YIKE = [
  {
    title: "Real impact",
    body: "Help millions of Nigerians find homes without scams, stress, or endless WhatsApp drama.",
  },
  {
    title: "Move fast",
    body: "Small team, big ambition — ship ideas in days, not quarters.",
  },
  {
    title: "Mobile-native",
    body: "We build for MTN 4G and thumb-scrolling — your work reaches people where they live.",
  },
  {
    title: "Trust-first",
    body: "Verification, moderation, and honest UX — we're not another listing spam site.",
  },
];

const CULTURE = [
  "Ownership over titles",
  "WhatsApp-speed communication",
  "Respect for Nigerian hustle",
  "Quality without corporate bloat",
];

const PROCESS = [
  { step: "1", title: "Apply in minutes", body: "Short form, optional CV — no 40-page portal." },
  { step: "2", title: "Smart review", body: "Our system scores fit so humans focus on great people." },
  { step: "3", title: "Chat on WhatsApp", body: "Shortlisted? We'll reach out directly — fast and friendly." },
];

async function getJobs(): Promise<JobRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return (data ?? []) as JobRow[];
}

export default async function CareersPage() {
  const jobs = await getJobs();

  return (
    <div className="pb-12">
      <PageHero
        title="Build the future of property discovery in Nigeria"
        subtitle="Join the team building a smarter real estate marketplace for millions of Nigerians."
        image={PAGE_IMAGERY.premium}
        badge="Careers"
        cta={jobs[0] ? { label: "View open roles", href: "#roles" } : undefined}
        secondaryCta={{ label: "About Yike", href: "/about" }}
        variant="premium"
      />

      <section id="roles" className="mx-auto max-w-5xl px-3 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-navy">Open roles</h2>
            <p className="mt-1 text-sm text-muted">
              {jobs.length === 0
                ? "No live roles right now — check back soon or say hi on WhatsApp."
                : `${jobs.length} opportunit${jobs.length === 1 ? "y" : "ies"} to build with us`}
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-float">
            <p className="text-sm text-muted">
              We&apos;re not hiring for a specific role at the moment, but ambitious people
              still catch our eye.
            </p>
            <Link
              href="/contact"
              className="pressable mt-4 inline-block rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy"
            >
              Get in touch
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface/80 py-12">
        <div className="mx-auto max-w-5xl px-3 lg:px-8">
          <h2 className="text-2xl font-bold text-navy">Why work with Yike</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {WHY_YIKE.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04]"
              >
                <h3 className="font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-3 py-12 lg:px-8">
        <h2 className="text-2xl font-bold text-navy">Team culture</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          We&apos;re a Nigerian startup — energetic, direct, and obsessed with making housing
          search feel as smooth as ordering food or scrolling TikTok.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {CULTURE.map((c) => (
            <li
              key={c}
              className="rounded-full bg-navy/5 px-4 py-2 text-sm font-semibold text-navy"
            >
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-5xl px-3 lg:px-8">
          <h2 className="text-2xl font-bold text-gold">How applying works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {PROCESS.map((p) => (
              <div key={p.step}>
                <span className="text-3xl font-black text-gold/40">{p.step}</span>
                <h3 className="mt-2 font-bold">{p.title}</h3>
                <p className="mt-1 text-sm text-white/70">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-3 pt-10 lg:px-8">
        <CtaBanner
          title="Ready to build with us?"
          body="Pick a role above or reach out — we'd love to meet sharp, hungry talent."
          primary={{
            label: jobs[0] ? "See open roles" : "Contact us",
            href: jobs[0] ? "#roles" : "/contact",
          }}
        />
      </div>
    </div>
  );
}

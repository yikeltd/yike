import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CareerApplicationForm } from "@/components/careers/application-form";
import type { JobRow } from "@/lib/careers/constants";
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
  if (!job) return { title: `Apply — ${SITE_NAME}` };
  return {
    title: `Apply — ${job.title} — ${SITE_NAME}`,
    description: `Apply for ${job.title} at Yike.`,
  };
}

export default async function CareerApplyPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  return (
    <div className="pb-12">
      <section className="border-b border-surface bg-white px-3 py-8">
        <div className="mx-auto max-w-xl">
          <Link
            href={`/careers/${job.slug}`}
            className="text-xs text-muted hover:text-gold-dark"
          >
            ← {job.title}
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-navy">Apply for this role</h1>
          <p className="mt-2 text-sm text-muted">
            Quick, friendly, autosaved — you&apos;ve got this.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-xl px-3 py-8">
        <CareerApplicationForm job={job} />
      </div>
    </div>
  );
}

import Link from "next/link";
import type { JobRow } from "@/lib/careers/constants";
import { categoryLabel, jobTypeLabel } from "@/lib/careers/constants";
import { cn } from "@/lib/utils";

export function JobCard({ job, className }: { job: JobRow; className?: string }) {
  return (
    <Link
      href={`/careers/${job.slug}`}
      className={cn(
        "pressable group block rounded-2xl bg-white p-5 shadow-float ring-1 ring-black/[0.04] transition-shadow hover:shadow-lg",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
            {categoryLabel(job.category)}
          </p>
          <h3 className="mt-1 text-lg font-bold text-navy group-hover:text-gold-dark">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {job.department} · {job.location}
          </p>
        </div>
        <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">
          {jobTypeLabel(job.job_type)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">
        {job.short_description}
      </p>
      <p className="mt-4 text-sm font-bold text-gold-dark">Apply →</p>
    </Link>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  label: string;
  value: number | string;
  href?: string;
  sub?: string;
  variant?: "default" | "warning" | "success" | "danger";
};

const variants = {
  default: "border-navy/10 bg-white",
  warning: "border-amber-200 bg-amber-50",
  success: "border-emerald-200 bg-emerald-50",
  danger: "border-red-200 bg-red-50",
};

export function MetricCard({ label, value, href, sub, variant = "default" }: Props) {
  const inner = (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md",
        variants[variant],
        href && "pressable cursor-pointer"
      )}
    >
      <p className="text-3xl font-black tabular-nums text-navy">{value}</p>
      <p className="mt-1 text-sm font-semibold text-navy/80">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/5 bg-surface/80">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">{children}</tbody>
        </table>
      </div>
      {!children && empty && (
        <p className="p-8 text-center text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "active" | "pending" | "open" | "disabled" | "failed" | "ok" | string;
}) {
  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    ok: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    open: "bg-amber-100 text-amber-800",
    disabled: "bg-slate-100 text-slate-600",
    suspended: "bg-red-100 text-red-700",
    archived: "bg-slate-100 text-slate-500",
    onboarding_pending: "bg-amber-100 text-amber-800",
    invited: "bg-sky-100 text-sky-800",
    onboarding_sent: "bg-indigo-100 text-indigo-800",
    first_login_pending: "bg-violet-100 text-violet-800",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        styles[status] ?? "bg-surface text-muted"
      )}
    >
      {status}
    </span>
  );
}

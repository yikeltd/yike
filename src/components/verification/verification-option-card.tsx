"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusVariant = "neutral" | "success" | "warning" | "pending";

const statusClasses: Record<StatusVariant, string> = {
  neutral: "text-muted",
  success: "text-emerald-700",
  warning: "text-amber-800",
  pending: "text-amber-800",
};

export function VerificationOptionCard({
  title,
  status,
  statusVariant = "neutral",
  actionLabel,
  onAction,
  href,
  disabled = false,
  className,
}: {
  title: string;
  status: string;
  statusVariant?: StatusVariant;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
}) {
  const interactive = Boolean((onAction || href) && actionLabel && !disabled);
  const classNames = cn(
    "flex w-full items-center gap-3 rounded-2xl border border-border bg-elevated p-4 text-left shadow-float",
    interactive && "pressable",
    disabled && !interactive && "opacity-90",
    className
  );

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className={cn("mt-0.5 text-xs font-medium", statusClasses[statusVariant])}>
          {status}
        </p>
      </div>
      {actionLabel ? (
        <span className="shrink-0 text-xs font-semibold text-navy">{actionLabel}</span>
      ) : null}
      {interactive ? <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden /> : null}
    </>
  );

  if (href && interactive) {
    return (
      <Link href={href} prefetch className={classNames}>
        {content}
      </Link>
    );
  }

  if (onAction && interactive) {
    return (
      <button type="button" onClick={onAction} className={classNames}>
        {content}
      </button>
    );
  }

  return <div className={classNames}>{content}</div>;
}

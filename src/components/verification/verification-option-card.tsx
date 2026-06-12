"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusVariant = "neutral" | "success" | "warning" | "pending";

const statusPillClass: Record<StatusVariant, string> = {
  neutral: "yike-status-pill yike-status-pill--neutral",
  success: "yike-status-pill yike-status-pill--success",
  warning: "yike-status-pill yike-status-pill--pending",
  pending: "yike-status-pill yike-status-pill--pending",
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
    "yike-card yike-card-compact flex w-full items-center gap-2.5 text-left",
    interactive && "yike-card-interactive pressable cursor-pointer",
    disabled && !interactive && "opacity-95",
    className
  );

  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-tight text-navy">{title}</p>
          <span className={cn(statusPillClass[statusVariant], "shrink-0")}>{status}</span>
        </div>
        {actionLabel && interactive ? (
          <p className="mt-1 text-[11px] font-semibold leading-tight text-navy/80">
            {actionLabel}
          </p>
        ) : null}
      </div>
      {interactive ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden /> : null}
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

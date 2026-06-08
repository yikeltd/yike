import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  VERIFICATION_GATE_SUBTEXT,
  VERIFICATION_GATE_TITLE,
} from "@/lib/copy/user-messages";
import type { VerificationTask } from "@/lib/verification/tasks";

type Props = {
  className?: string;
  tasks?: VerificationTask[];
  verificationHref?: string;
  hideActions?: boolean;
};

/** Compact trust gate — next step only, no repeated walls. */
export function VerificationTrustGate({
  className = "",
  tasks = [],
  verificationHref = "/agent/verification",
  hideActions = false,
}: Props) {
  const pending = tasks.filter((t) => t.required && !t.complete);
  const next = pending[0];

  return (
    <div
      className={`rounded-2xl border border-border bg-elevated px-4 py-3.5 shadow-float ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{VERIFICATION_GATE_TITLE}</p>
          {next ? (
            <p className="mt-0.5 text-xs text-muted">Next: {next.label}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">{VERIFICATION_GATE_SUBTEXT}</p>
          )}
          {!hideActions ? (
            <Link
              href={verificationHref}
              className="pressable mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark"
            >
              Open trust center
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

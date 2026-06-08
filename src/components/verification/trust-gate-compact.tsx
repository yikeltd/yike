import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import type { VerificationTask } from "@/lib/verification/tasks";

type Props = {
  tasks?: VerificationTask[];
  verificationHref?: string;
};

/** Contextual gate for listing flows — links to trust center, no repeated walls. */
export function TrustGateCompact({
  tasks = [],
  verificationHref = "/agent/verification",
}: Props) {
  const pending = tasks.filter((t) => t.required && !t.complete);
  const next = pending[0];

  return (
    <div
      className="rounded-2xl border border-border bg-elevated px-4 py-3.5 shadow-float"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">Verification needed to continue</p>
          {next ? (
            <p className="mt-0.5 text-xs text-muted">Next: {next.label}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">
              Complete your trust profile to unlock listing access.
            </p>
          )}
          <Link
            href={verificationHref}
            className="pressable mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-dark"
          >
            Open trust center
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

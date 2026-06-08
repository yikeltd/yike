import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  VERIFICATION_REQUIRED_MESSAGE,
  VERIFICATION_REQUIRED_SUBTEXT,
} from "@/lib/verification/constants";
import type { VerificationTask } from "@/lib/verification/tasks";

type Props = {
  className?: string;
  tasks?: VerificationTask[];
  verificationHref?: string;
  hideActions?: boolean;
};

export function VerificationTrustGate({
  className = "",
  tasks = [],
  verificationHref = "/agent/verification",
  hideActions = false,
}: Props) {
  const pending = tasks.filter((t) => t.required && !t.complete);

  return (
    <div
      className={`rounded-2xl border border-navy/10 bg-white p-5 shadow-sm ${className}`}
      role="status"
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-navy">{VERIFICATION_REQUIRED_MESSAGE}</p>
          <p className="mt-1 text-sm text-muted">{VERIFICATION_REQUIRED_SUBTEXT}</p>

          {pending.length > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm text-navy">
              {pending.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                  {task.label}
                </li>
              ))}
            </ul>
          ) : null}

          {!hideActions ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={verificationHref}
                className="inline-flex h-10 items-center rounded-xl bg-gold px-4 text-sm font-semibold text-navy"
              >
                Start verification
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center rounded-xl border border-navy/15 px-4 text-sm font-semibold text-navy"
              >
                Contact support
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

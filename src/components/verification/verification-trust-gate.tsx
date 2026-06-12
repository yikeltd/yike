import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { WHATSAPP_VERIFY_COPY } from "@/lib/whatsapp-verification/copy";
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
  verificationHref = "/agent/profile-setup",
  hideActions = false,
}: Props) {
  const pending = tasks.filter((t) => t.required && !t.complete);
  const next = pending[0];
  const isWhatsApp = next?.id === "whatsapp";
  const title = isWhatsApp
    ? WHATSAPP_VERIFY_COPY.listingGate
    : next?.label ?? "Complete your profile";
  const href = isWhatsApp ? "/agent/verification" : verificationHref;
  const actionLabel = isWhatsApp
    ? WHATSAPP_VERIFY_COPY.profileTitle
    : "Continue";

  return (
    <div
      className={`yike-card yike-card-compact flex items-center gap-2.5 ${className}`}
      role="status"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight text-navy">{title}</p>
        {!hideActions && next ? (
          <Link
            href={href}
            className="pressable mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-gold-dark"
          >
            {actionLabel}
            <ChevronRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

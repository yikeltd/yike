import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  VERIFICATION_REQUIRED_MESSAGE,
  VERIFICATION_REQUIRED_SUBTEXT,
} from "@/lib/verification/constants";

type Props = {
  className?: string;
  showCta?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
};

export function VerificationRequiredBanner({
  className = "",
  showCta = true,
  ctaHref = "/agent/verification",
  ctaLabel = "Complete verification",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-navy/10 bg-white p-5 shadow-sm ${className}`}
      role="status"
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{VERIFICATION_REQUIRED_MESSAGE}</p>
          <p className="mt-1 text-sm text-muted">{VERIFICATION_REQUIRED_SUBTEXT}</p>
          {showCta ? (
            <Link
              href={ctaHref}
              className="mt-3 inline-flex text-sm font-semibold text-navy underline underline-offset-2"
            >
              {ctaLabel} →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact safety link for property detail (desktop aside + mobile). */
export function SafetyNotice({
  compact = true,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <Link
        href="/safety"
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold text-navy/55 transition-colors hover:text-navy",
          className
        )}
      >
        <Shield className="h-3.5 w-3.5 text-gold" aria-hidden />
        Safety Tips →
      </Link>
    );
  }

  return (
    <div className={cn("rounded-2xl bg-surface/80 p-4 lg:p-5", className)}>
      <div className="flex gap-3">
        <Shield className="h-5 w-5 shrink-0 text-gold lg:h-6 lg:w-6" />
        <div>
          <p className="font-bold text-navy lg:text-base">Stay safe on Yike</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Meet in public. Verify before payment. Never send inspection fees to strangers.
          </p>
          <Link
            href="/safety"
            className="mt-2 inline-block text-sm font-bold text-gold-dark hover:underline"
          >
            Safety tips →
          </Link>
        </div>
      </div>
    </div>
  );
}

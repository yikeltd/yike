import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getDailySafetyMessage } from "@/constants/safetyMessages";
import { cn } from "@/lib/utils";

export function SafetyNotice({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const message = getDailySafetyMessage();

  return (
    <div
      className={cn(
        "rounded-2xl bg-surface/80 p-4 lg:p-5",
        className
      )}
    >
      <div className="flex gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-gold lg:h-6 lg:w-6" />
        <div>
          <p className="font-bold text-navy lg:text-base">Stay safe on Yike</p>
          <p
            className={cn(
              "mt-1 leading-relaxed text-muted",
              compact ? "line-clamp-2 text-xs" : "text-sm"
            )}
          >
            {message}
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

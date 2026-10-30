"use client";

import { Video } from "lucide-react";
import type { VideoCallPreflight } from "@/lib/video-calls/allowance";
import { YcAmount } from "@/components/yike-coins/yc-amount";
import { cn } from "@/lib/utils";

export function WalletVideoAllowance({
  video,
  className,
}: {
  video: VideoCallPreflight;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-navy/10 bg-surface/60 px-3.5 py-3",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/8 text-navy">
        <Video className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-bold text-navy">Video calls today</p>
        <p className="mt-0.5 text-navy/75">
          <span className="font-black text-navy">{video.freeAllowanceRemaining}</span>
          <span className="text-navy/60"> of </span>
          <span className="font-semibold">{video.freeAllowanceTotal}</span>
          <span className="text-navy/60"> free connected calls left</span>
        </p>
        <p className="mt-1 text-[11px] leading-snug text-muted">{video.resetExplanation}</p>
        {video.billable && video.priceCoins != null ? (
          <p className="mt-1 text-[11px] text-navy/65">
            After allowance: <YcAmount amount={video.priceCoins} /> per call
          </p>
        ) : video.billable ? (
          <p className="mt-1 text-[11px] text-amber-800">Extra call pricing pending approval.</p>
        ) : null}
      </div>
    </div>
  );
}

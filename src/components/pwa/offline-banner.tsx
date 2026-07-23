"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

/**
 * Compact offline toast — keeps marketplace UI visible.
 * Not a full-screen error. Auto-hides and soft-refreshes on reconnect.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const router = useRouter();
  const wasOffline = useRef(false);
  const [visible, setVisible] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setVisible(true);
      setReconnected(false);
      return;
    }

    if (wasOffline.current) {
      setReconnected(true);
      setVisible(true);
      // Soft refresh marketplace data without full navigation
      try {
        router.refresh();
      } catch {
        /* ignore */
      }
      const t = window.setTimeout(() => {
        setVisible(false);
        setReconnected(false);
        wasOffline.current = false;
      }, 2200);
      return () => window.clearTimeout(t);
    }

    setVisible(false);
  }, [online, router]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[80] flex justify-center px-3",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex max-w-md items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm shadow-lg backdrop-blur-md",
          reconnected
            ? "border-emerald-200/80 bg-emerald-50/95 text-emerald-950"
            : "border-navy/10 bg-navy/95 text-white",
        )}
      >
        {!reconnected && (
          <WifiOff className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        )}
        <p className="min-w-0 leading-snug">
          {reconnected
            ? "Back online. Refreshing…"
            : "You're offline. Showing recently viewed content."}
        </p>
      </div>
    </div>
  );
}

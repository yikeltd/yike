"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { isStandaloneApp } from "@/lib/app-environment";
import { cn } from "@/lib/utils";

const TRIGGER_PX = 68;
const MAX_PULL_PX = 88;

function ptrDisabled(pathname: string): boolean {
  return (
    pathname.startsWith("/browse") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/lex")
  );
}

function scrollAtTop(): boolean {
  return window.scrollY <= 1;
}

function sheetOpen(): boolean {
  return document.body.style.overflow === "hidden";
}

/** Native-style pull-to-refresh for installed PWA / Android TWA (no browser chrome). */
export function PullToRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const [standalone, setStandalone] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullPx = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStandalone(isStandaloneApp());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !standalone) return;
    if (ptrDisabled(pathname)) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing || sheetOpen() || !scrollAtTop()) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      pulling.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshing || sheetOpen()) return;
      const y = e.touches[0]?.clientY ?? 0;
      const dy = y - startY.current;
      if (dy <= 0 || !scrollAtTop()) {
        pullPx.current = 0;
        setPull(0);
        return;
      }
      const next = Math.min(MAX_PULL_PX, dy * 0.5);
      pullPx.current = next;
      setPull(next);
      if (next > 6) e.preventDefault();
    };

    const endPull = () => {
      if (!pulling.current) return;
      pulling.current = false;
      const amount = pullPx.current;
      if (amount >= TRIGGER_PX && !refreshing) {
        setRefreshing(true);
        setPull(TRIGGER_PX * 0.55);
        window.setTimeout(() => {
          router.refresh();
          window.setTimeout(() => {
            pullPx.current = 0;
            setPull(0);
            setRefreshing(false);
          }, 450);
        }, 120);
        return;
      }
      pullPx.current = 0;
      setPull(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", endPull);
    document.addEventListener("touchcancel", endPull);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", endPull);
      document.removeEventListener("touchcancel", endPull);
    };
  }, [pathname, refreshing, router, standalone]);

  if (!standalone || ptrDisabled(pathname)) return null;
  if (pull <= 0 && !refreshing) return null;

  const progress = Math.min(1, pull / TRIGGER_PX);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[65] flex justify-center"
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(4, pull - 20)}px)`,
      }}
      aria-hidden
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-[#031B4E]/95 shadow-float ring-1 ring-gold/35 backdrop-blur-sm",
          refreshing && "scale-100 opacity-100"
        )}
        style={{
          transform: refreshing ? undefined : `scale(${0.72 + progress * 0.28})`,
          opacity: refreshing ? 1 : 0.55 + progress * 0.45,
        }}
      >
        <Loader2
          className={cn(
            "h-4 w-4 text-gold",
            refreshing ? "animate-spin" : ""
          )}
          style={
            refreshing
              ? undefined
              : { transform: `rotate(${progress * 300}deg)` }
          }
        />
      </div>
    </div>
  );
}

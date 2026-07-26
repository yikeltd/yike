"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types/database";
import { DiscoverCard } from "@/components/discover/discover-card";
import { listingPath } from "@/lib/marketplace/listing-path";
import { motionEnabled } from "@/lib/swipe/low-data";
import { cn } from "@/lib/utils";

export type DiscoverSwipeAction = "skip" | "interested" | "open" | "specs";

type Props = {
  property: Property;
  nextProperty?: Property;
  saved: boolean;
  onToggleSave: () => void;
  onAction: (action: DiscoverSwipeAction) => void;
};

type DragHint = "left" | "right" | "up" | "down" | null;

const THRESHOLD = 110;
const EXIT_MS = 280;

function haptic() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(12);
    }
  } catch {
    /* ignore */
  }
}

export function DiscoverDeck({
  property,
  nextProperty,
  saved,
  onToggleSave,
  onAction,
}: Props) {
  const router = useRouter();
  const lowData = !motionEnabled();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<DragHint>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setExiting(null);
    setSpecsOpen(false);
    locked.current = false;
  }, [property.id]);

  const commit = useCallback(
    (action: DiscoverSwipeAction, hint: DragHint) => {
      if (locked.current) return;
      locked.current = true;
      haptic();
      setExiting(hint);

      if (action === "open") {
        window.setTimeout(() => {
          router.push(listingPath(property));
        }, EXIT_MS * 0.6);
        return;
      }

      if (action === "specs") {
        window.setTimeout(() => {
          setSpecsOpen((v) => !v);
          setOffset({ x: 0, y: 0 });
          setExiting(null);
          locked.current = false;
        }, 160);
        return;
      }

      window.setTimeout(() => {
        onAction(action);
        setOffset({ x: 0, y: 0 });
        setExiting(null);
      }, EXIT_MS);
    },
    [onAction, property, router],
  );

  const resolveGesture = useCallback(
    (dx: number, dy: number) => {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < THRESHOLD && absY < THRESHOLD) {
        setOffset({ x: 0, y: 0 });
        return;
      }
      if (absX >= absY) {
        if (dx > 0) commit("interested", "right");
        else commit("skip", "left");
      } else {
        if (dy < 0) commit("open", "up");
        else commit("specs", "down");
      }
    },
    [commit],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (locked.current || lowData) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || locked.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    setOffset({ x: dx, y: dy });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    start.current = null;
    setDragging(false);
    resolveGesture(dx, dy);
  }

  const hint: DragHint = (() => {
    if (exiting) return exiting;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    if (absX < 48 && absY < 48) return null;
    if (absX >= absY) return offset.x > 0 ? "right" : "left";
    return offset.y < 0 ? "up" : "down";
  })();

  const exitX =
    exiting === "left" ? -480 : exiting === "right" ? 480 : offset.x;
  const exitY =
    exiting === "up" ? -640 : exiting === "down" ? 220 : offset.y;
  const rotate = (exiting ? exitX : offset.x) * 0.04;

  return (
    <div className="relative h-full w-full">
      {nextProperty ? (
        <div
          className="absolute inset-0 scale-[0.94] opacity-40"
          aria-hidden
        >
          <DiscoverCard property={nextProperty} isActive={false} />
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-0 touch-none will-change-transform",
          !dragging && !exiting && "transition-transform duration-300 ease-out",
          exiting && "transition-transform duration-280 ease-in",
        )}
        style={{
          transform: `translate3d(${exiting ? exitX : offset.x}px, ${exiting ? exitY : offset.y}px, 0) rotate(${rotate}deg)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setOffset({ x: 0, y: 0 });
        }}
      >
        <DiscoverCard
          property={property}
          priority
          isActive
          saved={saved}
          onToggleSave={onToggleSave}
          showQuickSpecs={specsOpen}
          dragHint={hint}
        />
      </div>

      {lowData ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 px-4">
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
            onClick={() => commit("skip", "left")}
          >
            Skip
          </button>
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-gold px-3 py-1.5 text-[11px] font-bold text-navy"
            onClick={() => commit("interested", "right")}
          >
            Save
          </button>
          <button
            type="button"
            className="pointer-events-auto rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"
            onClick={() => commit("open", "up")}
          >
            Open
          </button>
        </div>
      ) : null}
    </div>
  );
}

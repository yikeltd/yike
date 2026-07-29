"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types/database";
import { DiscoverCard } from "@/components/discover/discover-card";
import { listingPath } from "@/lib/marketplace/listing-path";
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

const THRESHOLD = 90;
const EXIT_MS = 260;

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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<DragHint>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const locked = useRef(false);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setExiting(null);
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

      window.setTimeout(() => {
        onAction(action);
        setOffset({ x: 0, y: 0 });
        setExiting(null);
      }, EXIT_MS);
    },
    [onAction, property, router]
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
    [commit]
  );

  function onPointerDown(e: React.PointerEvent) {
    if (locked.current) return;
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
    exiting === "left" ? -500 : exiting === "right" ? 500 : offset.x;
  const exitY =
    exiting === "up" ? -700 : exiting === "down" ? 300 : offset.y;
  const rotate = (exiting ? exitX : offset.x) * 0.035;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {nextProperty ? (
        <div
          className="absolute inset-0 scale-[0.98] opacity-60 transition-all duration-300"
          aria-hidden
        >
          <DiscoverCard property={nextProperty} isActive={false} />
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-0 touch-none will-change-transform",
          !dragging && !exiting && "transition-transform duration-300 ease-out",
          exiting && "transition-transform duration-260 ease-in"
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
          dragHint={hint}
        />
      </div>
    </div>
  );
}

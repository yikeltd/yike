"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Property } from "@/types/database";
import { buildMotionSlides } from "@/lib/media/items";
import { getSlideDurationMs } from "@/lib/swipe/motion-timing";
import { preloadNextMotionFrame } from "@/lib/swipe/preload";
import { getSwipeImageWidth, motionEnabled } from "@/lib/swipe/low-data";
import {
  trackSwipeFrameComplete,
  trackSwipePhotoAdvance,
} from "@/lib/swipe/analytics";
import { optimizeListingImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

type Props = {
  property: Property;
  isActive: boolean;
  priority?: boolean;
};

export function MotionSlide({ property, isActive, priority }: Props) {
  const frames = useMemo(() => buildMotionSlides(property), [property]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const raf = useRef<number | null>(null);
  const startedAt = useRef(0);
  const kenBurns = motionEnabled();
  const imageWidth = getSwipeImageWidth();

  const duration = useMemo(
    () => getSlideDurationMs(frames.length),
    [frames.length]
  );

  const advance = useCallback(() => {
    setIndex((i) => {
      const next = (i + 1) % frames.length;
      trackSwipePhotoAdvance({
        listing_id: property.id,
        city: property.city,
        area: property.area,
        frame_count: frames.length,
        frame_index: next,
      });
      return next;
    });
    setProgress(0);
    startedAt.current = performance.now();
  }, [frames.length, property]);

  useEffect(() => {
    setIndex(0);
    setProgress(0);
    startedAt.current = performance.now();
  }, [property.id]);

  useEffect(() => {
    if (!isActive || frames.length <= 1) {
      if (raf.current) cancelAnimationFrame(raf.current);
      return;
    }

    preloadNextMotionFrame(property, index);
    startedAt.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (elapsed >= duration) {
        trackSwipeFrameComplete({
          listing_id: property.id,
          city: property.city,
          dwell_ms: Math.round(elapsed),
          frame_index: index,
          frame_count: frames.length,
        });
        advance();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [isActive, index, duration, frames.length, property, advance]);

  const current = frames[index] ?? frames[0];

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-dark">
      {frames.map((frame, i) => {
        const active = i === index;
        const src = optimizeListingImageUrl(frame.url, imageWidth);
        const isLoaded = loaded[frame.key];

        return (
          <div
            key={frame.key}
            className={cn(
              "absolute inset-0 motion-crossfade",
              active ? "z-[1] opacity-100" : "z-0 opacity-0"
            )}
            aria-hidden={!active}
          >
            {!isLoaded && (
              <div className="absolute inset-0 skeleton animate-pulse-soft" aria-hidden />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={frame.alt}
              decoding="async"
              loading={priority && i === 0 ? "eager" : "lazy"}
              fetchPriority={priority && i === 0 ? "high" : "auto"}
              onLoad={() =>
                setLoaded((prev) => ({ ...prev, [frame.key]: true }))
              }
              className={cn(
                "h-full w-full object-cover object-center transition-opacity duration-500 ease-out",
                isLoaded ? "opacity-100" : "opacity-0",
                active && kenBurns && "motion-ken-burns"
              )}
              style={
                active && kenBurns
                  ? { animationDuration: `${duration}ms` }
                  : undefined
              }
            />
          </div>
        );
      })}

      {current && (
        <div className="pointer-events-none absolute left-4 top-[calc(max(3.5rem,env(safe-area-inset-top))+0.5rem)] z-[2] max-w-[min(85%,20rem)]">
          <div className="inline-block rounded-lg bg-navy/35 px-2.5 py-1.5 backdrop-blur-[2px]">
            <p className="text-sm font-bold leading-tight text-white">
              {current.label}
            </p>
            {current.subLabel && (
              <p className="mt-0.5 text-xs font-medium text-white/85">
                {current.subLabel}
              </p>
            )}
          </div>
        </div>
      )}

      {frames.length > 1 && (
        <div className="pointer-events-none absolute left-3 right-3 top-[max(2.75rem,env(safe-area-inset-top))] z-[2] flex gap-1">
          {frames.map((frame, i) => (
            <div
              key={frame.key}
              className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20"
            >
              <div
                className="h-full rounded-full bg-white/90 ease-linear"
                style={{
                  width:
                    i < index
                      ? "100%"
                      : i === index
                        ? `${progress}%`
                        : "0%",
                  transition: i === index ? "none" : "width 0.3s ease-out",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

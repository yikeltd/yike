"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function PropertyVideo({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "100px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !videoRef.current) return;
    const v = videoRef.current;
    v.muted = true;
    v.playsInline = true;
    v.play().catch(() => {});
    setPlaying(true);
  }, [visible]);

  return (
    <div ref={ref} className="relative aspect-video overflow-hidden rounded-2xl bg-navy">
      {!visible && poster ? (
        <Image
          src={poster}
          alt={`${title} video preview`}
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
      ) : visible ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="h-full w-full object-cover"
          muted
          playsInline
          loop
          preload="metadata"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) {
              v.play();
              setPlaying(true);
            } else {
              v.pause();
              setPlaying(false);
            }
          }}
        />
      ) : (
        <div className="skeleton absolute inset-0" />
      )}
      {!playing && visible && (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center bg-navy/30"
          )}
        >
          <Play className="h-12 w-12 text-gold" fill="currentColor" />
        </span>
      )}
    </div>
  );
}

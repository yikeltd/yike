"use client";

import { useAuth } from "@/components/auth/auth-provider";

type Props = {
  className?: string;
};

export function DynamicWatermark({ className = "" }: Props) {
  const { profile, user } = useAuth();
  const rawUsername = profile?.username || (user?.email ? user.email.split("@")[0] : null);
  const watermarkText = rawUsername ? `@${rawUsername.replace(/^@/, "")}` : "@yike.ng";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 select-none overflow-hidden z-10 opacity-[0.08] ${className}`}
    >
      <div className="absolute -inset-[50%] flex flex-wrap items-center justify-center gap-x-12 gap-y-10 rotate-[-25deg]">
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className="text-xs font-black tracking-widest text-white uppercase whitespace-nowrap drop-shadow-sm flex items-center gap-1.5"
          >
            <span>{watermarkText}</span>
            <span className="text-[8px] opacity-60">👑</span>
          </span>
        ))}
      </div>
    </div>
  );
}

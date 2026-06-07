"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { UserAvatar } from "@/components/profile/user-avatar";
import { cn } from "@/lib/utils";

export function AuthHeaderAccount({ className }: { className?: string }) {
  const { user, profile, loading, openAuth } = useAuth();

  if (loading) {
    return (
      <span
        className={cn("inline-block h-9 w-20 rounded-xl bg-surface", className)}
        aria-hidden
      />
    );
  }

  if (user) {
    const label = profile?.full_name ?? profile?.username ?? "Profile";
    return (
      <Link
        href="/agent"
        className={cn(
          "pressable flex items-center gap-2 rounded-xl border border-surface bg-elevated px-3 py-1.5 text-sm font-semibold text-foreground",
          className
        )}
      >
        <UserAvatar
          name={label}
          avatarUrl={profile?.avatar_url}
          size="sm"
          className="!h-8 !w-8 !rounded-full !text-xs"
        />
        <span className="max-w-[120px] truncate">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openAuth({ type: "profile", redirectPath: "/agent" })}
      className={cn(
        "pressable rounded-xl border border-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold/40",
        className
      )}
    >
      Sign In
    </button>
  );
}

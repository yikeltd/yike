"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/components/auth/auth-provider";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  getDefaultConsolePath,
  isStaffRole,
  isSuperAdmin,
  staffRoleLabel,
} from "@/lib/admin/roles";
import type { Profile, UserRole } from "@/types/database";
import { cn } from "@/lib/utils";

function resolveProfileRole(user: User, profile: Profile | null): UserRole | null {
  if (profile?.role) return profile.role;
  const metaRole = user.user_metadata?.role;
  return typeof metaRole === "string" ? (metaRole as UserRole) : null;
}

function accountLabel(user: User, profile: Profile | null, role: UserRole | null) {
  const name = profile?.full_name?.trim() || profile?.username?.trim();
  if (name) return name;
  if (role && isStaffRole(role)) return staffRoleLabel(role);
  return "Profile";
}

function accountHref(role: UserRole | null) {
  if (role && isStaffRole(role)) return getDefaultConsolePath(role);
  return "/agent";
}

export function AuthHeaderAccount({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "desktop";
}) {
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
    const role = resolveProfileRole(user, profile);

    if (variant === "desktop") {
      const label = accountLabel(user, profile, role);
      return (
        <Link
          href={accountHref(role)}
          className={cn(
            "pressable flex max-w-[11rem] items-center gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-surface/80",
            className
          )}
        >
          <UserAvatar
            name={label}
            avatarUrl={profile?.avatar_url}
            size="sm"
            className="!h-9 !w-9 !rounded-full !text-xs"
          />
          <span className="truncate text-sm font-semibold text-foreground">
            {label}
          </span>
        </Link>
      );
    }

    if (role && isSuperAdmin(role)) {
      return (
        <Link
          href={getDefaultConsolePath(role)}
          className={cn(
            "pressable rounded-xl border border-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold/40",
            className
          )}
        >
          Admin
        </Link>
      );
    }

    if (role && isStaffRole(role)) {
      return (
        <Link
          href={getDefaultConsolePath(role)}
          className={cn(
            "pressable rounded-xl border border-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold/40",
            className
          )}
        >
          Dashboard
        </Link>
      );
    }

    if (profile) {
      const label = accountLabel(user, profile, role);
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
            avatarUrl={profile.avatar_url}
            size="sm"
            className="!h-8 !w-8 !rounded-full !text-xs"
          />
          <span className="max-w-[120px] truncate">{label}</span>
        </Link>
      );
    }

    return (
      <Link
        href="/agent"
        className={cn(
          "pressable rounded-xl border border-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold/40",
          className
        )}
      >
        Profile
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openAuth({ type: "profile", redirectPath: "/agent" })}
      className={cn(
        variant === "desktop"
          ? "pressable rounded-xl px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface/80"
          : "pressable rounded-xl border border-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold/40",
        className
      )}
    >
      Sign in
    </button>
  );
}

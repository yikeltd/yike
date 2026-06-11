"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/profile/user-avatar";
import { agentPublicPath } from "@/lib/agent-slugs";
import { getSellerType, sellerTypeLabel } from "@/lib/profile-display";
import type { PublicFollowProfile } from "@/lib/social/types";
import type { Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

export function ProfileFollowList({
  endpoint,
  emptyMessage,
}: {
  endpoint: "/api/social/followers" | "/api/social/following";
  emptyMessage: string;
}) {
  const [profiles, setProfiles] = useState<PublicFollowProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch(endpoint)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load list.");
        if (!cancelled) setProfiles(data.profiles ?? []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>;
  }

  if (profiles.length === 0) {
    return (
      <p className="rounded-2xl border border-navy/10 bg-white px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-navy/10 bg-white shadow-sm">
      {profiles.map((profile) => {
        const displayName =
          profile.company_name?.trim() ||
          profile.full_name?.trim() ||
          profile.username?.trim() ||
          "Yike user";
        const sellerType = getSellerType({
          account_type: profile.account_type,
          agent_type: profile.account_type,
          company_name: profile.company_name,
        } as Profile);
        const href = agentPublicPath({
          id: profile.id,
          public_slug: profile.public_slug,
        });

        return (
          <li key={profile.id}>
            <Link
              href={href}
              className="flex items-center gap-3 px-4 py-3 pressable hover:bg-surface/60"
            >
              <UserAvatar
                name={displayName}
                avatarUrl={profile.avatar_url}
                size="md"
                className="rounded-full"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-navy">{displayName}</p>
                {sellerType ? (
                  <p className="text-xs text-muted">{sellerTypeLabel(sellerType)}</p>
                ) : profile.username ? (
                  <p className="text-xs text-muted">@{profile.username}</p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

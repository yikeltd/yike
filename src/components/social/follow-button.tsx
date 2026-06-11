"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FollowButton({
  userId,
  className,
}: {
  userId: string;
  className?: string;
}) {
  const { user, guardAction } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const isSelf = user?.id === userId;

  useEffect(() => {
    if (!user?.id || isSelf) {
      setChecked(true);
      return;
    }

    let cancelled = false;
    void fetch(`/api/social/follow/status?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((data: { following?: boolean }) => {
        if (!cancelled) {
          setFollowing(Boolean(data.following));
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, userId, isSelf]);

  if (isSelf || !checked) return null;

  async function toggle() {
    setLoading(true);
    const prev = following;
    setFollowing(!prev);

    const res = await fetch("/api/social/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      setFollowing(prev);
    } else {
      const data = (await res.json()) as { following?: boolean };
      setFollowing(Boolean(data.following));
    }
    setLoading(false);
  }

  function onClick() {
    guardAction(
      {
        type: "profile",
        redirectPath: typeof window !== "undefined" ? window.location.pathname : "/",
      },
      () => void toggle()
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "outline" : "navy"}
      className={cn("h-9 rounded-full px-5 text-sm font-semibold", className)}
      onClick={onClick}
      disabled={loading}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

"use client";

import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function SavedGuestPrompt() {
  const { openAuth } = useAuth();

  useEffect(() => {
    openAuth({ type: "saved", redirectPath: "/saved" });
  }, [openAuth]);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-surface bg-elevated px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15">
        <Heart className="h-7 w-7 text-gold-dark dark:text-gold" />
      </span>
      <h2 className="mt-4 text-lg font-bold">Save homes you love</h2>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Create a free Yike account to save listings and sync across your devices.
      </p>
      <Button
        type="button"
        className="mt-6"
        onClick={() => openAuth({ type: "saved", redirectPath: "/saved" })}
      >
        Sign in or create account
      </Button>
    </div>
  );
}

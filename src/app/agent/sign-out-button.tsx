"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export function AgentSignOut() {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    if (busy) return;
    setBusy(true);
    await signOut("/");
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 py-3 text-sm text-muted disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {busy ? "Logging out…" : "Log out"}
    </button>
  );
}

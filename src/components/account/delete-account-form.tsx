"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeleteAccountForm({ email }: { email: string }) {
  const router = useRouter();
  const { gateSensitiveAction, sensitiveActionModals } = useSensitiveActionGate(email);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const verified = await gateSensitiveAction("delete_account");
    if (!verified.ok) return;

    setLoading(true);

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not delete account. Try again or email hello@yike.ng.");
      return;
    }

    router.replace("/?account_deleted=1");
    router.refresh();
  }

  return (
    <>
      {sensitiveActionModals}
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          This permanently removes your profile, saved homes, and listings. Type{" "}
          <strong className="text-foreground">DELETE</strong> to confirm.
        </p>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type DELETE"
          autoComplete="off"
          aria-label="Confirm deletion"
        />
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}
        <Button
          type="submit"
          variant="danger"
          fullWidth
          disabled={loading || confirm !== "DELETE"}
        >
          {loading ? "Deleting…" : "Delete my account permanently"}
        </Button>
      </form>
    </>
  );
}

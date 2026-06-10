"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { performFastLogout } from "@/lib/auth/fast-logout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { FieldLabel } from "@/components/ui/field-label";

export function DeleteAccountForm({ email }: { email: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Could not delete account. Try again or email hello@yike.ng.");
      return;
    }

    await performFastLogout();
    router.replace("/?account_deleted=1");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Signed in as <strong className="text-foreground">{email}</strong>. This permanently
        removes your profile, saved homes, and listings. Type{" "}
        <strong className="text-foreground">DELETE</strong> and enter your password to confirm.
      </p>
      <div>
        <FieldLabel>Password</FieldLabel>
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="h-12 rounded-xl"
          revealLabel="password"
        />
      </div>
      <div>
        <FieldLabel>Type DELETE to confirm</FieldLabel>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          className="h-12 rounded-xl"
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      <Button
        type="submit"
        variant="danger"
        fullWidth
        disabled={loading || confirm !== "DELETE" || password.length < 8}
      >
        {loading ? "Deleting…" : "Delete my account permanently"}
      </Button>
    </form>
  );
}

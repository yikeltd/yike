"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { crewBrand } from "@/lib/design/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StaffSetPasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/staff/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: current, new_password: next }),
    });
    const data = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not update password.");
      return;
    }

    router.replace("/lex?app=staff");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src={crewBrand.logoSm}
            alt=""
            width={72}
            height={72}
            className="mx-auto rounded-2xl shadow-lg"
          />
          <h1 className="mt-4 text-xl font-bold text-white">Set your Yike password</h1>
          <p className="mt-2 text-sm text-white/60">
            Your admin requires a new password before you continue.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
        >
          <label className="block">
            <span className="text-xs font-semibold text-white/70">Temporary password</span>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1.5 border-white/15 bg-navy/60 text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-white/70">New password</span>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 border-white/15 bg-navy/60 text-white"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-white/70">Confirm new password</span>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="mt-1.5 border-white/15 bg-navy/60 text-white"
            />
          </label>
          {error && (
            <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-red-200">{error}</p>
          )}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Updating…" : "Update password & continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}

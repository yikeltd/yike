"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const ITEMS = [
  { key: "password_changed", label: "Change password", href: "/lex/auth/staff/set-password" },
  { key: "pin_set", label: "Set your PIN", href: null },
  { key: "read_ops_guide", label: "Read operations guide", href: "/lex/support" },
  { key: "confirm_availability", label: "Confirm availability", href: null },
] as const;

export function StaffFirstLoginChecklist() {
  const [open, setOpen] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff/onboarding-checklist", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      showChecklist?: boolean;
      checklist?: Record<string, boolean>;
    };
    if (data.showChecklist) {
      setChecklist(data.checklist ?? {});
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: string, completed: boolean) {
    const res = await fetch("/api/staff/onboarding-checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, completed }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { checklist?: Record<string, boolean> };
    setChecklist(data.checklist ?? {});
    const allDone = ITEMS.every((i) => data.checklist?.[i.key]);
    if (allDone) setOpen(false);
  }

  if (!open || dismissed) return null;

  const doneCount = ITEMS.filter((i) => checklist[i.key]).length;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 mx-auto max-w-md sm:bottom-6 sm:left-auto sm:right-6">
      <div className="rounded-2xl border border-gold/30 bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
              Welcome to Yike Crew
            </p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              Complete your setup ({doneCount}/{ITEMS.length})
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-muted hover:text-navy"
          >
            Later
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {ITEMS.map((item) => {
            const done = checklist[item.key];
            return (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => void toggle(item.key, !done)}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs",
                    done
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-navy/20 text-transparent"
                  )}
                  aria-label={item.label}
                >
                  ✓
                </button>
                {item.href && !done ? (
                  <Link href={item.href} className="text-navy underline-offset-2 hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span className={done ? "text-muted line-through" : "text-navy"}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

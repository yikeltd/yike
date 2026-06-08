"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/lib/admin/navigation";
import { flattenNavGroups } from "@/lib/admin/navigation";

type Props = {
  groups: NavGroup[];
  open: boolean;
  onClose: () => void;
};

function matchItem(
  query: string,
  label: string,
  keywords?: string[]
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (label.toLowerCase().includes(q)) return true;
  return (keywords ?? []).some((k) => k.toLowerCase().includes(q));
}

export function AdminCommandPalette({ groups, open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const items = useMemo(() => flattenNavGroups(groups), [groups]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 12);
    return items.filter((item) => matchItem(query, item.label, item.keywords));
  }, [items, query]);

  const go = useCallback(
    (href: string) => {
      onClose();
      setQuery("");
      router.push(href);
    },
    [onClose, router]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-navy/50 p-4 pt-[12vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close search"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search admin tools"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-float-lg"
      >
        <div className="flex items-center gap-2 border-b border-navy/8 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin tools…"
            className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded border border-navy/10 px-1.5 py-0.5 text-[10px] text-muted sm:inline">
            esc
          </kbd>
        </div>
        <ul className="max-h-[min(50vh,360px)] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-muted">
              No tools match &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((item) => (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  className="pressable flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-navy hover:bg-gold/10"
                >
                  <span>{item.label}</span>
                  {item.emphasis === "muted" ? (
                    <span className="text-[10px] uppercase text-muted">Advanced</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export function AdminCommandTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hidden items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/15 hover:text-white sm:flex",
        className
      )}
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search tools…</span>
      <kbd className="rounded border border-white/20 px-1 text-[10px]">⌘K</kbd>
    </button>
  );
}

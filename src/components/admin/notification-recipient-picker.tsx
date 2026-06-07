"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipientSearchType } from "@/lib/notifications/admin/constants";

export type SelectedRecipient = {
  id: string;
  display_name: string;
  subtitle: string;
  avatar_url: string | null;
};

type SearchResult = SelectedRecipient & {
  type: RecipientSearchType;
  status: string | null;
  verification_status: string | null;
};

export function NotificationRecipientPicker({
  searchType,
  selected,
  onChange,
  disabled,
}: {
  searchType: RecipientSearchType;
  selected: SelectedRecipient[];
  onChange: (next: SelectedRecipient[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const res = await fetch(
        `/api/admin/notification-recipients?type=${searchType}&q=${encodeURIComponent(q)}`
      );
      const data = (await res.json()) as { results?: SearchResult[] };
      const picked = new Set(selected.map((s) => s.id));
      setResults((data.results ?? []).filter((r) => !picked.has(r.id)));
      setLoading(false);
    },
    [searchType, selected]
  );

  useEffect(() => {
    const t = setTimeout(() => void search(query), 280);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function addRecipient(r: SearchResult) {
    onChange([
      ...selected,
      {
        id: r.id,
        display_name: r.display_name,
        subtitle: r.subtitle,
        avatar_url: r.avatar_url,
      },
    ]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeRecipient(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div ref={wrapRef} className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={`Search by name, email, phone, or code…`}
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold"
        />
        {open && query.length >= 2 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
            {loading && (
              <li className="px-3 py-2 text-xs text-muted">Searching…</li>
            )}
            {!loading && results.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted">No matches</li>
            )}
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-elevated"
                  onClick={() => addRecipient(r)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy">
                    {r.display_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-navy">
                      {r.display_name}
                    </span>
                    <span className="block truncate text-[11px] text-muted">{r.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted">
            {selected.length} selected
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange([])}
            className="text-[10px] font-bold text-gold-dark underline"
          >
            Clear all
          </button>
        </div>
      )}

      <ul className="flex flex-wrap gap-2">
        {selected.map((r) => (
          <li
            key={r.id}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-elevated py-1 pl-2 pr-1 text-xs"
            )}
          >
            <span className="truncate font-semibold text-navy">{r.display_name}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeRecipient(r.id)}
              className="rounded-full p-0.5 text-muted hover:bg-white hover:text-navy"
              aria-label={`Remove ${r.display_name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadRecentEntities,
  saveRecentEntity,
  type RecentEntity,
} from "@/lib/admin/entity-search/recent";
import type { AdminEntitySearchResult } from "@/lib/admin/entity-search";
import { EntityPreviewCard } from "./entity-preview-card";
import {
  ENTITY_PLACEHOLDERS,
  type AdminEntityItem,
  type AdminEntitySelectorProps,
} from "./types";

function toItem(result: AdminEntitySearchResult | RecentEntity): AdminEntityItem {
  return {
    id: result.id,
    display_name: result.display_name,
    subtitle: result.subtitle,
    image_url: result.image_url,
    badge: "badge" in result ? (result.badge ?? null) : null,
    meta: "meta" in result ? result.meta : undefined,
  };
}

export function AdminEntitySelector({
  entityType,
  selected,
  onChange,
  mode = "multi",
  placeholder,
  disabled,
  excludeIds = [],
  filters,
  showPreview = true,
  className,
}: AdminEntitySelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminEntityItem[]>([]);
  const [recent, setRecent] = useState<RecentEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const pickedIds = useMemo(
    () => new Set([...selected.map((s) => s.id), ...excludeIds]),
    [selected, excludeIds]
  );

  useEffect(() => {
    setRecent(loadRecentEntities(entityType));
  }, [entityType]);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams({
        type: entityType,
        q,
        limit: "15",
      });
      if (excludeIds.length > 0) params.set("exclude", excludeIds.join(","));
      if (filters?.status) params.set("status", filters.status);
      if (filters?.verified) params.set("verified", "1");
      if (filters?.city) params.set("city", filters.city);
      if (filters?.property_type) params.set("property_type", filters.property_type);

      const res = await fetch(`/api/admin/entity-search?${params}`);
      const data = (await res.json()) as { results?: AdminEntitySearchResult[] };
      const items = (data.results ?? [])
        .map(toItem)
        .filter((r) => !pickedIds.has(r.id));
      setResults(items);
      setLoading(false);
    },
    [entityType, excludeIds, filters, pickedIds]
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

  function selectEntity(item: AdminEntityItem) {
    saveRecentEntity(entityType, {
      id: item.id,
      display_name: item.display_name,
      subtitle: item.subtitle,
      image_url: item.image_url,
    });
    setRecent(loadRecentEntities(entityType));

    if (mode === "single") {
      onChange([item]);
    } else {
      onChange([...selected, item]);
    }
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeEntity(id: string) {
    onChange(selected.filter((s) => s.id !== id));
  }

  const showDropdown = open && (query.length >= 2 || (query.length === 0 && recent.length > 0));
  const filteredRecent = recent
    .filter((r) => !pickedIds.has(r.id))
    .map(toItem);

  return (
    <div ref={wrapRef} className={cn("space-y-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          disabled={disabled || (mode === "single" && selected.length > 0)}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder ?? ENTITY_PLACEHOLDERS[entityType]}
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold"
        />
        {showDropdown && (
          <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
            {query.length < 2 && filteredRecent.length > 0 && (
              <>
                <li className="sticky top-0 border-b bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                  <Clock className="mr-1 inline h-3 w-3" />
                  Recent
                </li>
                {filteredRecent.map((r) => (
                  <li key={`recent-${r.id}`}>
                    <EntityPreviewCard
                      entity={r}
                      compact
                      onClick={() => selectEntity(r)}
                      className="rounded-none border-0 border-b"
                    />
                  </li>
                ))}
              </>
            )}
            {query.length >= 2 && loading && (
              <li className="px-3 py-3 text-xs text-muted">Searching…</li>
            )}
            {query.length >= 2 && !loading && results.length === 0 && (
              <li className="px-3 py-3 text-xs text-muted">No matches — try area, city, or agent name</li>
            )}
            {query.length >= 2 &&
              results.map((r) => (
                <li key={r.id}>
                  <EntityPreviewCard
                    entity={r}
                    compact
                    onClick={() => selectEntity(r)}
                    className="rounded-none border-0 border-b"
                  />
                </li>
              ))}
          </ul>
        )}
      </div>

      {mode === "multi" && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted">{selected.length} selected</span>
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

      {showPreview && selected.length > 0 && (
        <div className={cn("space-y-2", mode === "multi" && "flex flex-wrap gap-2 space-y-0")}>
          {selected.map((entity) =>
            mode === "multi" ? (
              <span
                key={entity.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-elevated py-1 pl-2 pr-1 text-xs"
              >
                <span className="truncate font-semibold text-navy">{entity.display_name}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeEntity(entity.id)}
                  className="rounded-full p-0.5 text-muted hover:bg-white hover:text-navy"
                  aria-label={`Remove ${entity.display_name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <div key={entity.id} className="relative">
                <EntityPreviewCard entity={entity} />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange([])}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-muted shadow-sm hover:text-navy"
                  aria-label="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { propertyPath } from "@/lib/property-url";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AdminEntitySelector } from "@/components/admin/selection";
import { EntityPreviewCard } from "@/components/admin/selection/entity-preview-card";
import type { AdminEntityItem } from "@/components/admin/selection/types";
import type { AdminEntitySearchResult } from "@/lib/admin/entity-search";

type HotPickRow = {
  id: string;
  property_id: string;
  title: string | null;
  badge: string;
  sort_order: number;
  is_active: boolean;
  property: Property | null;
};

export function HotPickManager({ picks }: { picks: HotPickRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("Hot pick");
  const [selectedListing, setSelectedListing] = useState<AdminEntityItem[]>([]);
  const [bulkSelected, setBulkSelected] = useState<AdminEntityItem[]>([]);
  const [suggestions, setSuggestions] = useState<AdminEntityItem[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const existingIds = picks.map((p) => p.property_id);
  const sortedPicks = [...picks].sort((a, b) => a.sort_order - b.sort_order);

  const refresh = useCallback(() => router.refresh(), [router]);

  const loadSuggestions = useCallback(async () => {
    const params = new URLSearchParams({
      exclude: existingIds.join(","),
      limit: "12",
    });
    const res = await fetch(`/api/admin/hot-picks/suggestions?${params}`);
    const data = (await res.json()) as { suggestions?: AdminEntitySearchResult[] };
    setSuggestions(
      (data.suggestions ?? []).map((s) => ({
        id: s.id,
        display_name: s.display_name,
        subtitle: s.subtitle,
        image_url: s.image_url,
        badge: s.badge,
        meta: s.meta,
      }))
    );
  }, [existingIds]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  async function insertPick(propertyId: string, opts?: { title?: string; badge?: string }) {
    if (existingIds.includes(propertyId)) return false;
    const res = await fetch("/api/admin/hot-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        property_id: propertyId,
        title: opts?.title,
        badge: opts?.badge,
      }),
    });
    return res.ok;
  }

  async function addPick() {
    const listing = selectedListing[0];
    if (!listing) return;
    setBusy("add");
    const ok = await insertPick(listing.id, { title, badge });
    if (ok) {
      setSelectedListing([]);
      setTitle("");
      setBadge("Hot pick");
      refresh();
      void loadSuggestions();
    }
    setBusy(null);
  }

  async function bulkAdd() {
    if (bulkSelected.length === 0) return;
    setBusy("bulk");
    for (const item of bulkSelected) {
      await insertPick(item.id);
    }
    setBulkSelected([]);
    refresh();
    void loadSuggestions();
    setBusy(null);
  }

  async function quickAdd(id: string) {
    setBusy(`quick-${id}`);
    await insertPick(id);
    refresh();
    void loadSuggestions();
    setBusy(null);
  }

  async function toggleActive(id: string, is_active: boolean) {
    setBusy(id);
    await fetch("/api/admin/hot-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", id, is_active }),
    });
    setBusy(null);
    refresh();
  }

  async function removePick(id: string) {
    setBusy(`del-${id}`);
    await fetch("/api/admin/hot-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setBusy(null);
    refresh();
    void loadSuggestions();
  }

  async function movePick(id: string, direction: "up" | "down") {
    const idx = sortedPicks.findIndex((p) => p.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sortedPicks.length) return;
    await swapOrder(sortedPicks[idx], sortedPicks[swapIdx]);
  }

  async function swapOrder(a: HotPickRow, b: HotPickRow) {
    setBusy(`move-${a.id}`);
    await fetch("/api/admin/hot-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder",
        items: [
          { id: a.id, sort_order: b.sort_order },
          { id: b.id, sort_order: a.sort_order },
        ],
      }),
    });
    setBusy(null);
    refresh();
  }

  async function reorderByDrag(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    const sourceIdx = sortedPicks.findIndex((p) => p.id === sourceId);
    const targetIdx = sortedPicks.findIndex((p) => p.id === targetId);
    if (sourceIdx < 0 || targetIdx < 0) return;

    const reordered = [...sortedPicks];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    setBusy("reorder");
    await fetch("/api/admin/hot-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder",
        items: reordered.map((pick, index) => ({ id: pick.id, sort_order: index })),
      }),
    });
    setBusy(null);
    refresh();
  }

  function pickToEntity(pick: HotPickRow): AdminEntityItem {
    const property = pick.property;
    const agentName = property?.agent_id ? "Listed by agent" : "";
    return {
      id: pick.property_id,
      display_name: pick.title?.trim() || property?.title || "Listing",
      subtitle: property
        ? `${property.area}, ${property.city} · ${formatPrice(Number(property.price), property.payment_period, property.listing_type)}`
        : agentName,
      image_url: property?.media_urls?.[0] ?? null,
      badge: pick.is_active ? "Live" : "Hidden",
    };
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-float">
        <h2 className="text-lg font-semibold text-navy">Add hot pick</h2>
        <p className="mt-1 text-sm text-muted">
          Search and select a listing — no UUIDs needed. Inactive picks stay hidden from the site.
        </p>
        <div className="mt-4 space-y-4">
          <AdminEntitySelector
            entityType="listing"
            mode="single"
            selected={selectedListing}
            onChange={setSelectedListing}
            excludeIds={existingIds}
            filters={{ status: "approved" }}
            disabled={!!busy}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Headline override (optional)"
              className="rounded-xl border px-3 py-2.5 text-sm"
            />
            <input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Badge label"
              className="rounded-xl border px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={!!busy || selectedListing.length === 0}
              onClick={addPick}
              className="pressable flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {busy === "add" ? "Adding…" : "Add pick"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-float">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
              <Sparkles className="h-5 w-5 text-gold" />
              Recommended hot picks
            </h2>
            <p className="mt-1 text-sm text-muted">
              High engagement, verified listings, trusted agents, quality photos
            </p>
          </div>
          {bulkSelected.length > 0 && (
            <button
              type="button"
              disabled={!!busy}
              onClick={bulkAdd}
              className="pressable rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white"
            >
              {busy === "bulk" ? "Adding…" : `Add ${bulkSelected.length} selected`}
            </button>
          )}
        </div>
        <div className="mt-4">
          <AdminEntitySelector
            entityType="listing"
            mode="multi"
            selected={bulkSelected}
            onChange={setBulkSelected}
            excludeIds={existingIds}
            filters={{ status: "approved" }}
            showPreview
            disabled={!!busy}
            placeholder="Search to add multiple picks at once…"
          />
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((s) => (
            <li key={s.id}>
              <EntityPreviewCard
                entity={s}
                compact
                action={
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => quickAdd(s.id)}
                    className="pressable shrink-0 rounded-lg bg-gold px-2.5 py-1.5 text-[11px] font-bold text-navy"
                  >
                    {busy === `quick-${s.id}` ? "…" : "Add"}
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-navy">
          Carousel order ({sortedPicks.filter((p) => p.is_active).length} live)
        </h2>
        <p className="mt-1 text-sm text-muted">
          Drag to reorder on desktop, or use arrows. Preview before going live.
        </p>
        {sortedPicks.length === 0 ? (
          <p className="mt-4 rounded-2xl border bg-white p-6 text-sm text-muted">
            No hot picks yet. Search above or add from recommendations.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedPicks.map((pick, i) => {
              const entity = pickToEntity(pick);
              const property = pick.property;
              const isDragging = dragId === pick.id;
              const isOver = dragOverId === pick.id;

              return (
                <li
                  key={pick.id}
                  draggable
                  onDragStart={() => setDragId(pick.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(pick.id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) void reorderByDrag(dragId, pick.id);
                    setDragId(null);
                    setDragOverId(null);
                  }}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border bg-white p-4 transition-shadow sm:flex-row sm:items-center",
                    !pick.is_active && "opacity-60",
                    isDragging && "opacity-40",
                    isOver && "border-gold shadow-md"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className="mt-1 cursor-grab text-muted active:cursor-grabbing"
                      aria-hidden
                    >
                      <GripVertical className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <EntityPreviewCard entity={entity} compact className="border-0 p-0" />
                      <p className="mt-1 text-xs text-muted">
                        Badge: {pick.badge} · Position {i + 1}
                        {property?.views_count != null && ` · ${property.views_count} views`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <button
                      type="button"
                      disabled={!!busy || i === 0}
                      onClick={() => movePick(pick.id, "up")}
                      className="rounded-lg border p-2 disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!!busy || i === sortedPicks.length - 1}
                      onClick={() => movePick(pick.id, "down")}
                      className="rounded-lg border p-2 disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    {property && (
                      <Link
                        href={propertyPath(property)}
                        target="_blank"
                        className="rounded-lg border p-2 text-muted hover:text-navy"
                        aria-label="Preview listing"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => toggleActive(pick.id, !pick.is_active)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold",
                        pick.is_active ? "bg-navy text-white" : "bg-surface text-muted"
                      )}
                    >
                      {pick.is_active ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {pick.is_active ? "Live" : "Hidden"}
                    </button>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => removePick(pick.id)}
                      className="rounded-xl border border-red-200 p-2 text-red-600"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

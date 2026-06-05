"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { Property } from "@/types/database";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

type HotPickRow = {
  id: string;
  property_id: string;
  title: string | null;
  badge: string;
  sort_order: number;
  is_active: boolean;
  property: Property | null;
};

export function HotPickManager({
  picks,
  candidates,
}: {
  picks: HotPickRow[];
  candidates: Property[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [badge, setBadge] = useState("Hot pick");

  const existingIds = new Set(picks.map((p) => p.property_id));

  async function refresh() {
    router.refresh();
  }

  async function addPick() {
    if (!propertyId.trim()) return;
    setBusy("add");
    const supabase = createClient();
    const maxOrder = picks.reduce((m, p) => Math.max(m, p.sort_order), -1);
    await supabase.from("home_hot_picks").insert({
      property_id: propertyId.trim(),
      title: title.trim() || null,
      badge: badge.trim() || "Hot pick",
      sort_order: maxOrder + 1,
      is_active: true,
    });
    setPropertyId("");
    setTitle("");
    setBadge("Hot pick");
    setBusy(null);
    refresh();
  }

  async function toggleActive(id: string, is_active: boolean) {
    setBusy(id);
    const supabase = createClient();
    await supabase.from("home_hot_picks").update({ is_active }).eq("id", id);
    setBusy(null);
    refresh();
  }

  async function removePick(id: string) {
    setBusy(`del-${id}`);
    const supabase = createClient();
    await supabase.from("home_hot_picks").delete().eq("id", id);
    setBusy(null);
    refresh();
  }

  async function movePick(id: string, direction: "up" | "down") {
    const sorted = [...picks].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;

    setBusy(`move-${id}`);
    const supabase = createClient();
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await supabase.from("home_hot_picks").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("home_hot_picks").update({ sort_order: a.sort_order }).eq("id", b.id);
    setBusy(null);
    refresh();
  }

  async function quickAdd(id: string) {
    setPropertyId(id);
    setBusy(`quick-${id}`);
    const supabase = createClient();
    const maxOrder = picks.reduce((m, p) => Math.max(m, p.sort_order), -1);
    await supabase.from("home_hot_picks").insert({
      property_id: id,
      badge: "Hot pick",
      sort_order: maxOrder + 1,
      is_active: true,
    });
    setBusy(null);
    refresh();
  }

  const sortedPicks = [...picks].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6 shadow-float">
        <h2 className="text-lg font-semibold text-navy">Add hot pick</h2>
        <p className="mt-1 text-sm text-muted">
          Approved listings appear in the home carousel. Drag order with arrows;
          inactive picks stay hidden from the site.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="Listing ID (UUID)"
            className="rounded-xl border px-3 py-2.5 text-sm"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline (optional)"
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
            disabled={!!busy || !propertyId.trim()}
            onClick={addPick}
            className="pressable flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {busy === "add" ? "Adding…" : "Add pick"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-navy">
          Active carousel ({sortedPicks.filter((p) => p.is_active).length} live)
        </h2>
        {sortedPicks.length === 0 ? (
          <p className="mt-4 rounded-2xl border bg-white p-6 text-sm text-muted">
            No hot picks yet. Add from the form above or quick-add from suggestions
            below.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sortedPicks.map((pick, i) => {
              const property = pick.property;
              return (
                <li
                  key={pick.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-center sm:justify-between",
                    !pick.is_active && "opacity-60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">
                      {pick.title?.trim() || property?.title || pick.property_id}
                    </p>
                    {property && (
                      <p className="text-sm text-muted">
                        {property.city} ·{" "}
                        {formatPrice(
                          Number(property.price),
                          property.payment_period,
                          property.listing_type
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      Badge: {pick.badge} · Order {pick.sort_order + 1}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => toggleActive(pick.id, !pick.is_active)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-semibold",
                        pick.is_active
                          ? "bg-navy text-white"
                          : "bg-surface text-muted"
                      )}
                    >
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

      <section>
        <h2 className="text-lg font-semibold text-navy">Quick add from listings</h2>
        <ul className="mt-4 space-y-3">
          {candidates
            .filter((p) => !existingIds.has(p.id))
            .slice(0, 12)
            .map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border bg-white p-4"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted">
                    {p.city} · {p.views_count ?? 0} views
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => quickAdd(p.id)}
                  className="pressable rounded-xl bg-gold px-3 py-2 text-xs font-bold text-navy"
                >
                  {busy === `quick-${p.id}` ? "…" : "Add"}
                </button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

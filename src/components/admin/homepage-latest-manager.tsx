"use client";

import { useCallback, useState } from "react";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { AdminEntitySelector } from "@/components/admin/selection";
import type { AdminEntityItem } from "@/components/admin/selection/types";
import { CarouselRail } from "@/components/marketplace/experience/carousel-rail";
import type { Property } from "@/types/database";
import type { LatestOnYikeConfig } from "@/lib/home/latest-on-yike-config";
import {
  LATEST_ON_YIKE_MAX_PER_CATEGORY,
  LATEST_ON_YIKE_MAX_TOTAL,
} from "@/lib/home/latest-on-yike-config";
import { cn } from "@/lib/utils";

type PreviewMeta = {
  usedSampleFixture?: boolean;
  unavailableManualCount?: number;
  error?: boolean;
};

export function HomepageLatestManager({
  initialConfig,
  initialPreview,
  initialMeta,
}: {
  initialConfig: LatestOnYikeConfig;
  initialPreview: Property[];
  initialMeta?: PreviewMeta;
}) {
  const { requirePin, pinModal } = usePinGate();
  const [config, setConfig] = useState(initialConfig);
  const [preview, setPreview] = useState(initialPreview);
  const [meta, setMeta] = useState<PreviewMeta>(initialMeta ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pickerItems, setPickerItems] = useState<AdminEntityItem[]>([]);

  const refreshFromServer = useCallback(async () => {
    const res = await fetch("/api/admin/homepage-latest");
    if (!res.ok) return;
    const data = (await res.json()) as {
      config: LatestOnYikeConfig;
      preview: Property[];
      preview_meta?: PreviewMeta;
    };
    setConfig(data.config);
    setPreview(data.preview);
    setMeta(data.preview_meta ?? {});
  }, []);

  async function save(next: LatestOnYikeConfig) {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/homepage-latest", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = (await res.json()) as {
      error?: string;
      config?: LatestOnYikeConfig;
      preview?: Property[];
      preview_meta?: PreviewMeta;
    };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setConfig(data.config ?? next);
    setPreview(data.preview ?? []);
    setMeta(data.preview_meta ?? {});
    setSaved(true);
  }

  function onSaveClick() {
    requirePin(() => void save(config));
  }

  function addManualListing(item: AdminEntityItem) {
    if (config.manualListingIds.includes(item.id)) return;
    setConfig((c) => ({
      ...c,
      mode: "manual",
      manualListingIds: [...c.manualListingIds, item.id].slice(
        0,
        LATEST_ON_YIKE_MAX_TOTAL,
      ),
    }));
    setPickerItems([]);
  }

  function moveManual(id: string, dir: -1 | 1) {
    setConfig((c) => {
      const idx = c.manualListingIds.indexOf(id);
      if (idx < 0) return c;
      const next = [...c.manualListingIds];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return c;
      [next[idx], next[swap]] = [next[swap]!, next[idx]!];
      return { ...c, manualListingIds: next };
    });
  }

  function removeManual(id: string) {
    setConfig((c) => ({
      ...c,
      manualListingIds: c.manualListingIds.filter((x) => x !== id),
    }));
  }

  return (
    <div className="space-y-8">
      {pinModal}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-navy">Section settings</h2>

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-muted">
              Mode
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                checked={config.mode === "automatic"}
                onChange={() =>
                  setConfig((c) => ({ ...c, mode: "automatic" }))
                }
              />
              Automatic latest (newest approved listings)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="mode"
                checked={config.mode === "manual"}
                onChange={() => setConfig((c) => ({ ...c, mode: "manual" }))}
              />
              Manual curation (ordered list)
            </label>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-muted">
              Categories
            </legend>
            {(
              [
                ["property", "Property"],
                ["vehicle", "Vehicles"],
                ["electronics", "Electronics"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.enabledCategories[key]}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      enabledCategories: {
                        ...c.enabledCategories,
                        [key]: e.target.checked,
                      },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>

          <label className="block text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">
              Total items (max {LATEST_ON_YIKE_MAX_TOTAL})
            </span>
            <input
              type="number"
              min={1}
              max={LATEST_ON_YIKE_MAX_TOTAL}
              value={config.totalLimit}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  totalLimit: Number(e.target.value),
                }))
              }
              className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["property", "Property cap"],
                ["vehicle", "Vehicle cap"],
                ["electronics", "Electronics cap"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs">
                <span className="font-semibold text-muted">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={LATEST_ON_YIKE_MAX_PER_CATEGORY}
                  value={config.perCategoryLimits[key] ?? ""}
                  placeholder="Auto"
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      perCategoryLimits: {
                        ...c.perCategoryLimits,
                        [key]: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-navy/15 px-2 py-1.5"
                />
              </label>
            ))}
          </div>

          {config.mode === "manual" ? (
            <div className="space-y-3 border-t border-navy/10 pt-4">
              <p className="text-sm font-semibold text-navy">Selected listings</p>
              <ul className="space-y-2">
                {config.manualListingIds.map((id) => (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-xl border border-navy/10 bg-surface px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono">{id}</span>
                    <button
                      type="button"
                      className="pressable rounded-lg px-2 py-1 text-navy/70"
                      onClick={() => moveManual(id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="pressable rounded-lg px-2 py-1 text-navy/70"
                      onClick={() => moveManual(id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="pressable rounded-lg px-2 py-1 text-red-600"
                      onClick={() => removeManual(id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <AdminEntitySelector
                entityType="listing"
                selected={pickerItems}
                mode="single"
                filters={{ status: "approved" }}
                onChange={(items) => {
                  setPickerItems(items);
                  if (items[0]) addManualListing(items[0]);
                }}
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="text-sm font-medium text-emerald-700">Saved.</p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={onSaveClick}
              className={cn(
                "pressable rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-navy",
                busy && "opacity-60",
              )}
            >
              {busy ? "Saving…" : "Save & publish"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refreshFromServer()}
              className="pressable rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy"
            >
              Refresh preview
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-navy">Live preview</h2>
          {meta.unavailableManualCount ? (
            <p className="text-xs text-amber-700">
              {meta.unavailableManualCount} manual pick(s) skipped (expired,
              unpublished, or unavailable).
            </p>
          ) : null}
          {meta.usedSampleFixture ? (
            <p className="text-xs font-semibold text-amber-800">
              Preview uses dev sample fixtures — not live inventory.
            </p>
          ) : null}
          {preview.length > 0 ? (
            <CarouselRail items={preview} priorityCount={2} />
          ) : (
            <p className="rounded-xl border border-dashed border-navy/15 px-4 py-8 text-center text-sm text-muted">
              No publishable listings match these settings yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

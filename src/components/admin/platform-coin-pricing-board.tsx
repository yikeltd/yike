"use client";

import { useCallback, useEffect, useState } from "react";

type PlatformPriceRow = {
  service_code: string;
  price_coins: number | null;
  label: string;
  description: string | null;
  active: boolean;
};

export function PlatformCoinPricingBoard() {
  const [rows, setRows] = useState<PlatformPriceRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeDrafts, setActiveDrafts] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/platform-pricing");
    const data = (await res.json()) as { pricing?: PlatformPriceRow[]; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not load platform coin pricing");
      return;
    }
    setRows(data.pricing ?? []);
    setDrafts({});
    setActiveDrafts({});
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveRow(serviceCode: string) {
    setBusy(true);
    setError(null);
    setMessage(null);

    const priceRaw = drafts[serviceCode];
    const active =
      activeDrafts[serviceCode] ??
      rows.find((r) => r.service_code === serviceCode)?.active ??
      false;

    const body: {
      serviceCode: string;
      active: boolean;
      priceCoins?: number | null;
    } = { serviceCode, active };

    if (priceRaw !== undefined && priceRaw !== "") {
      body.priceCoins = Number(priceRaw);
    } else if (serviceCode === "listing_boost") {
      body.priceCoins = null;
    }

    const res = await fetch("/api/admin/platform-pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }

    setMessage(`Updated ${serviceCode}`);
    await load();
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-muted">
        Platform coin pricing is unavailable until migrations are applied on this environment.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-navy">Yike Coins platform services</h2>
        <p className="text-sm text-muted">
          Video call overage price and coin-based boost activation. Top-up packs use Paystack catalog.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      )}

      <ul className="divide-y divide-navy/10">
        {rows.map((row) => (
          <li key={row.service_code} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy">{row.label}</p>
              <p className="text-xs text-muted">{row.description ?? row.service_code}</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {row.service_code !== "listing_boost" && (
                <label className="text-xs font-medium text-navy">
                  Price (coins)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="mt-1 block w-28 rounded-lg border border-navy/15 px-2 py-1.5 text-sm"
                    placeholder={row.price_coins != null ? String(row.price_coins) : "—"}
                    value={drafts[row.service_code] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.service_code]: e.target.value }))
                    }
                  />
                </label>
              )}
              <label className="flex items-center gap-2 text-xs font-medium text-navy">
                <input
                  type="checkbox"
                  checked={activeDrafts[row.service_code] ?? row.active}
                  onChange={(e) =>
                    setActiveDrafts((d) => ({ ...d, [row.service_code]: e.target.checked }))
                  }
                />
                Active
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveRow(row.service_code)}
                className="rounded-lg bg-gold px-3 py-2 text-xs font-bold text-navy disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

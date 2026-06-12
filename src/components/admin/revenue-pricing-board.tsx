"use client";

import { useCallback, useEffect, useState } from "react";
import type { RevenuePricingCatalog } from "@/lib/revenue-pricing/types";
import { formatPrice } from "@/lib/utils";

const PRODUCT_LABELS: Record<string, string> = {
  featured_listing: "Featured listings",
  boost_listing: "Boost listings",
  verification_fee: "Business verification",
  property_verification: "Property verification",
  lead_insights: "Lead Insights",
  advertisement: "Sponsored ads",
};

export function RevenuePricingBoard() {
  const [catalog, setCatalog] = useState<RevenuePricingCatalog | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [subDrafts, setSubDrafts] = useState<Record<string, string>>({});
  const [termDiscountDrafts, setTermDiscountDrafts] = useState<Record<string, string>>({});
  const [termLabelDrafts, setTermLabelDrafts] = useState<Record<string, string>>({});
  const [termShortDrafts, setTermShortDrafts] = useState<Record<string, string>>({});
  const [termActiveDrafts, setTermActiveDrafts] = useState<Record<string, boolean>>({});
  const [newTerm, setNewTerm] = useState({
    months: "",
    label: "",
    short_label: "",
    discount: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/revenue/pricing");
    const data = (await res.json()) as {
      catalog?: RevenuePricingCatalog;
      canEdit?: boolean;
      error?: string;
    };
    if (!res.ok) {
      setError(data.error ?? "Could not load pricing");
      return;
    }
    setCatalog(data.catalog ?? null);
    setCanEdit(Boolean(data.canEdit));
    setDrafts({});
    setSubDrafts({});
    setTermDiscountDrafts({});
    setTermLabelDrafts({});
    setTermShortDrafts({});
    setTermActiveDrafts({});
    setNewTerm({ months: "", label: "", short_label: "", discount: "" });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!catalog) return;
    setBusy(true);
    setError(null);

    const items = catalog.items
      .filter((item) => drafts[item.id] != null)
      .map((item) => ({
        id: item.id,
        amount: Number(drafts[item.id]),
      }))
      .filter((i) => Number.isFinite(i.amount) && i.amount >= 0);

    const subscriptions = catalog.subscriptions
      .filter((plan) => subDrafts[plan.id] != null)
      .map((plan) => ({
        id: plan.id,
        monthly_price: Number(subDrafts[plan.id]),
      }))
      .filter((p) => Number.isFinite(p.monthly_price) && p.monthly_price >= 0);

    const billingTerms = catalog.billingTerms
      .map((term) => {
        const patch: {
          id: string;
          discount_percent?: number;
          label?: string;
          short_label?: string;
          active?: boolean;
        } = { id: term.id };

        if (termDiscountDrafts[term.id] != null) {
          patch.discount_percent = Number(termDiscountDrafts[term.id]);
        }
        if (termLabelDrafts[term.id] != null) {
          patch.label = termLabelDrafts[term.id];
        }
        if (termShortDrafts[term.id] != null) {
          patch.short_label = termShortDrafts[term.id];
        }
        if (termActiveDrafts[term.id] != null) {
          patch.active = termActiveDrafts[term.id];
        }

        return Object.keys(patch).length > 1 ? patch : null;
      })
      .filter((term): term is NonNullable<typeof term> => term != null);

    const billingTermCreates =
      newTerm.months && newTerm.label.trim() && newTerm.short_label.trim()
        ? [
            {
              months: Number(newTerm.months),
              label: newTerm.label.trim(),
              short_label: newTerm.short_label.trim(),
              discount_percent: Number(newTerm.discount || 0),
            },
          ]
        : [];

    const res = await fetch("/api/admin/revenue/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, subscriptions, billingTerms, billingTermCreates }),
    });
    const data = (await res.json()) as { catalog?: RevenuePricingCatalog; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setCatalog(data.catalog ?? catalog);
    setDrafts({});
    setSubDrafts({});
    setTermDiscountDrafts({});
    setTermLabelDrafts({});
    setTermShortDrafts({});
    setTermActiveDrafts({});
    setNewTerm({ months: "", label: "", short_label: "", discount: "" });
  }

  async function toggleFoundingOffer(enabled: boolean) {
    setBusy(true);
    const res = await fetch("/api/admin/revenue/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offers: { founding_subscription_offer: enabled } }),
    });
    setBusy(false);
    if (res.ok) void load();
  }

  if (!catalog) {
    return <p className="text-sm text-muted">{error ?? "Loading pricing…"}</p>;
  }

  const grouped = catalog.items.reduce<Record<string, typeof catalog.items>>((acc, item) => {
    const key = item.product;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-white p-4">
        <h2 className="text-sm font-bold text-navy">Offers</h2>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={catalog.offers.founding_subscription_offer}
            disabled={!canEdit || busy}
            onChange={(e) => void toggleFoundingOffer(e.target.checked)}
          />
          Founding subscription offer (lock launch pricing for early subscribers)
        </label>
      </div>

      {Object.entries(grouped).map(([product, items]) => (
        <section key={product} className="rounded-xl border border-border bg-white p-4">
          <h2 className="text-sm font-bold text-navy">{PRODUCT_LABELS[product] ?? product}</h2>
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">{item.label}</p>
                  <p className="text-xs text-muted font-mono">{item.variant_key}</p>
                </div>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-32 rounded-lg border border-border px-3 py-2 text-sm"
                    value={drafts[item.id] ?? String(item.amount)}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                    }
                  />
                ) : (
                  <p className="font-bold text-navy tabular-nums">
                    {formatPrice(item.amount, "total", "rent")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-xl border border-border bg-white p-4">
        <h2 className="text-sm font-bold text-navy">Billing periods & discounts</h2>
        <p className="mt-1 text-xs text-muted">
          Upfront terms on /pricing and /agent/plans — change discounts without a deploy.
        </p>
        <ul className="mt-3 space-y-3">
          {catalog.billingTerms.map((term) => (
            <li
              key={term.id}
              className="grid gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <div>
                <p className="font-medium text-navy">
                  {term.label}{" "}
                  <span className="text-xs font-normal text-muted">({term.months} mo)</span>
                </p>
                <p className="text-xs text-muted font-mono">{term.short_label}</p>
              </div>
              {canEdit ? (
                <>
                  <label className="text-xs text-muted">
                    Discount %
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      className="mt-1 w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
                      value={termDiscountDrafts[term.id] ?? String(term.discount_percent)}
                      onChange={(e) =>
                        setTermDiscountDrafts((d) => ({ ...d, [term.id]: e.target.value }))
                      }
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Chip label
                    <input
                      type="text"
                      className="mt-1 w-28 rounded-lg border border-border px-2 py-1.5 text-sm"
                      value={termShortDrafts[term.id] ?? term.short_label}
                      onChange={(e) =>
                        setTermShortDrafts((d) => ({ ...d, [term.id]: e.target.value }))
                      }
                    />
                  </label>
                  <label className="flex items-end gap-2 pb-1 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={termActiveDrafts[term.id] ?? term.active}
                      onChange={(e) =>
                        setTermActiveDrafts((d) => ({ ...d, [term.id]: e.target.checked }))
                      }
                    />
                    Active
                  </label>
                </>
              ) : (
                <p className="font-bold text-navy tabular-nums sm:col-span-3">
                  −{term.discount_percent}%
                </p>
              )}
            </li>
          ))}
        </ul>
        {canEdit ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-3">
            <p className="text-xs font-bold text-navy">Add billing period</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <input
                type="number"
                min={1}
                max={36}
                placeholder="Months"
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
                value={newTerm.months}
                onChange={(e) => setNewTerm((t) => ({ ...t, months: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Label e.g. 9 months"
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
                value={newTerm.label}
                onChange={(e) => setNewTerm((t) => ({ ...t, label: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Chip e.g. 9 mo"
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
                value={newTerm.short_label}
                onChange={(e) => setNewTerm((t) => ({ ...t, short_label: e.target.value }))}
              />
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Discount %"
                className="rounded-lg border border-border px-2 py-1.5 text-sm"
                value={newTerm.discount}
                onChange={(e) => setNewTerm((t) => ({ ...t, discount: e.target.value }))}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border bg-white p-4">
        <h2 className="text-sm font-bold text-navy">Subscription plans</h2>
        <p className="mt-1 text-xs text-muted">Monthly prices and limits — edit in place.</p>
        <ul className="mt-3 space-y-3">
          {catalog.subscriptions.map((plan) => (
            <li key={plan.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-navy">{plan.name}</p>
                <p className="text-xs text-muted font-mono">{plan.plan_code}</p>
              </div>
              {canEdit ? (
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-32 rounded-lg border border-border px-3 py-2 text-sm"
                  value={subDrafts[plan.id] ?? String(plan.monthly_price)}
                  onChange={(e) =>
                    setSubDrafts((d) => ({ ...d, [plan.id]: e.target.value }))
                  }
                />
              ) : (
                <p className="font-bold text-navy tabular-nums">
                  {formatPrice(plan.monthly_price, "total", "rent")}/mo
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {canEdit ? (
        <button
          type="button"
          disabled={
            busy ||
            (Object.keys(drafts).length === 0 &&
              Object.keys(subDrafts).length === 0 &&
              Object.keys(termDiscountDrafts).length === 0 &&
              Object.keys(termLabelDrafts).length === 0 &&
              Object.keys(termShortDrafts).length === 0 &&
              Object.keys(termActiveDrafts).length === 0 &&
              !newTerm.months)
          }
          onClick={() => void save()}
          className="rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save pricing"}
        </button>
      ) : (
        <p className="text-xs text-muted">Chief admin can edit prices here — no deploy required.</p>
      )}
    </div>
  );
}

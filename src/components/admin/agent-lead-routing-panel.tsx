"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePinGate } from "@/components/admin/pin-confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RoutingData = {
  agent: {
    routing_mode: string;
    allow_direct_whatsapp: boolean;
    billing_mode: string;
    default_lead_price: number | null;
    premium_lead_price: number | null;
    lead_billing_enabled: boolean;
    direct_routing_health_status: string;
    direct_whatsapp_disabled_reason: string | null;
    allow_direct_calls: boolean;
    call_routing_mode: string;
    default_call_lead_price: number | null;
    direct_call_disabled_reason: string | null;
  };
  wallet: { balance: number; currency: string; status: string } | null;
  stats: {
    total: number;
    direct: number;
    concierge: number;
    duplicates: number;
    charged: number;
    waived: number;
  };
};

export function AgentLeadRoutingPanel({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { requirePin, pinModal } = usePinGate();
  const [data, setData] = useState<RoutingData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("Manual top-up");
  const [walletRef, setWalletRef] = useState("");
  const [walletMode, setWalletMode] = useState<"topup" | "subtract" | "waive">(
    "topup"
  );

  useEffect(() => {
    void fetch(`/api/admin/agents/${agentId}/routing`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [agentId]);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/admin/agents/${agentId}/routing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(body.error ?? "Update failed");
      return;
    }
    setMessage("Saved");
    router.refresh();
    const fresh = await fetch(`/api/admin/agents/${agentId}/routing`).then((r) =>
      r.json()
    );
    setData(fresh);
  }

  if (!data?.agent) {
    return (
      <section className="rounded-2xl border border-navy/10 bg-white p-5 text-sm text-muted">
        Loading lead routing…
      </section>
    );
  }

  const a = data.agent;

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
      {pinModal}
      <h2 className="font-bold text-navy">Lead routing</h2>
      <p className="text-xs text-muted">
        Internal only. Direct WhatsApp requires global flag + authorization.
      </p>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <label className="block">
          <span className="font-semibold text-navy">Routing mode</span>
          <select
            defaultValue={a.routing_mode}
            onChange={(e) =>
              requirePin(() => patch({ routing_mode: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2"
          >
            <option value="yike_concierge">Yike concierge</option>
            <option value="direct_whatsapp">Direct WhatsApp</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>

        <label className="block">
          <span className="font-semibold text-navy">Billing mode</span>
          <select
            defaultValue={a.billing_mode}
            onChange={(e) =>
              requirePin(() =>
                patch({ action: "billing_mode", billing_mode: e.target.value })
              )
            }
            className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2"
          >
            <option value="free">Free</option>
            <option value="pay_per_lead">Pay per lead</option>
            <option value="subscription">Subscription</option>
            <option value="manual_invoice">Manual invoice</option>
            <option value="waived">Waived</option>
          </select>
        </label>

        <label className="block">
          <span className="font-semibold text-navy">Default lead price (₦)</span>
          <Input
            type="number"
            min={0}
            defaultValue={a.default_lead_price ?? ""}
            onBlur={(e) =>
              requirePin(() =>
                patch({
                  action: "lead_price",
                  default_lead_price: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              )
            }
            className="mt-1"
          />
        </label>

        <label className="block">
          <span className="font-semibold text-navy">Premium lead price (₦)</span>
          <Input
            type="number"
            min={0}
            defaultValue={a.premium_lead_price ?? ""}
            onBlur={(e) =>
              requirePin(() =>
                patch({
                  premium_lead_price: e.target.value ? Number(e.target.value) : null,
                })
              )
            }
            className="mt-1"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {a.allow_direct_whatsapp ? (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              requirePin(() =>
                patch({
                  action: "disable_direct",
                  disabled_reason: "Disabled by admin",
                })
              )
            }
          >
            Disable direct WhatsApp
          </Button>
        ) : (
          <Button
            disabled={busy}
            onClick={() => requirePin(() => patch({ action: "enable_direct" }))}
          >
            Enable direct WhatsApp (PIN)
          </Button>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={a.lead_billing_enabled}
            onChange={(e) =>
              requirePin(() =>
                patch({ lead_billing_enabled: e.target.checked })
              )
            }
          />
          Lead billing enabled
        </label>
      </div>

      {a.direct_whatsapp_disabled_reason && (
        <p className="text-xs text-amber-800">
          Disabled: {a.direct_whatsapp_disabled_reason}
        </p>
      )}

      <div className="rounded-xl bg-surface/80 p-4 text-sm">
        <p className="font-bold text-navy">Wallet</p>
        <p className="mt-1 tabular-nums text-lg font-black">
          ₦{Number(data.wallet?.balance ?? 0).toLocaleString("en-NG")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            type="number"
            placeholder="Amount"
            value={walletAmount}
            onChange={(e) => setWalletAmount(e.target.value)}
            className="max-w-[140px]"
          />
          <Input
            placeholder="Reason"
            value={walletReason}
            onChange={(e) => setWalletReason(e.target.value)}
            className="max-w-[200px]"
          />
          <select
            value={walletMode}
            onChange={(e) =>
              setWalletMode(e.target.value as "topup" | "subtract" | "waive")
            }
            className="rounded-lg border border-navy/15 px-2 py-2 text-xs"
          >
            <option value="topup">Add balance</option>
            <option value="subtract">Subtract</option>
            <option value="waive">Waive credit</option>
          </select>
          <Input
            placeholder="Reference"
            value={walletRef}
            onChange={(e) => setWalletRef(e.target.value)}
            className="max-w-[160px]"
          />
          <Button
            disabled={busy || !walletAmount}
            onClick={() => {
              const raw = Number(walletAmount);
              const signed =
                walletMode === "subtract" ? -Math.abs(raw) : Math.abs(raw);
              requirePin(() =>
                patch({
                  wallet_adjustment: signed,
                  wallet_reason: walletReason,
                  wallet_reference: walletRef || undefined,
                  wallet_ledger_type:
                    walletMode === "waive" ? "waiver" : walletMode === "topup" ? "topup" : "adjustment",
                })
              );
            }}
          >
            Adjust balance (PIN)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
        {[
          ["Leads", data.stats.total],
          ["Direct", data.stats.direct],
          ["Concierge", data.stats.concierge],
          ["Dupes", data.stats.duplicates],
          ["Charged", data.stats.charged],
          ["Waived", data.stats.waived],
        ].map(([label, val]) => (
          <div key={label as string} className="rounded-lg border border-navy/10 p-2">
            <p className="font-black text-navy tabular-nums">{val}</p>
            <p className="text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-navy/10 pt-4 space-y-4">
        <h3 className="font-bold text-navy">Call routing</h3>
        <p className="text-xs text-muted">
          Internal only. Direct calls require global flag + agent authorization.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <label className="block">
            <span className="font-semibold text-navy">Call routing mode</span>
            <select
              defaultValue={a.call_routing_mode ?? "whatsapp_only"}
              onChange={(e) =>
                requirePin(() =>
                  patch({
                    action: "call_routing_mode",
                    call_routing_mode: e.target.value,
                  })
                )
              }
              className="mt-1 w-full rounded-lg border border-navy/15 px-3 py-2"
            >
              <option value="whatsapp_only">WhatsApp only</option>
              <option value="direct_calls">Direct calls</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>

          <label className="block">
            <span className="font-semibold text-navy">Call lead price (₦)</span>
            <Input
              type="number"
              min={0}
              defaultValue={a.default_call_lead_price ?? ""}
              onBlur={(e) =>
                requirePin(() =>
                  patch({
                    action: "call_lead_price",
                    default_call_lead_price: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                )
              }
              className="mt-1"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {a.allow_direct_calls ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                requirePin(() =>
                  patch({
                    action: "disable_direct_calls",
                    disabled_reason: "Disabled by admin",
                  })
                )
              }
            >
              Disable direct calls
            </Button>
          ) : (
            <Button
              disabled={busy}
              onClick={() =>
                requirePin(() => patch({ action: "enable_direct_calls" }))
              }
            >
              Enable direct calls (PIN)
            </Button>
          )}
        </div>

        {a.direct_call_disabled_reason && (
          <p className="text-xs text-amber-800">
            Calls disabled: {a.direct_call_disabled_reason}
          </p>
        )}
      </div>
    </section>
  );
}

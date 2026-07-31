"use client";

import { useState } from "react";
import Link from "next/link";
import { Key, Webhook, Copy, Plus, Send, Check } from "lucide-react";

export function DeveloperCredentialsManager() {
  const [apiKeys] = useState([
    { id: "KEY_1", name: "Production Key", token: "yike_live_8492019482103", created: "Jul 20, 2026", env: "Live" },
    { id: "KEY_2", name: "Staging Test Key", token: "yike_test_1029481029411", created: "Jul 22, 2026", env: "Test" },
  ]);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pingSent, setPingSent] = useState(false);

  function handleCopyKey(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedKey(token);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function handleSendPing() {
    setPingSent(true);
    setTimeout(() => setPingSent(false), 3000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-navy/10 dark:border-white/10 pb-4">
          <div>
            <h1 className="text-xl font-black text-navy dark:text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-gold" />
              API Credentials & Webhooks Desk
            </h1>
            <p className="text-xs text-navy/60 dark:text-white/60 mt-0.5">
              Manage secret bearer API keys and register real-time webhook endpoints.
            </p>
          </div>

          <Link href="/developers" className="rounded-2xl bg-gold text-navy px-4 py-2 text-xs font-black hover:bg-gold-light">
            API Documentation
          </Link>
        </div>

        {/* API KEYS SECTION */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <Key className="h-4 w-4 text-gold" />
              API Bearer Keys
            </h2>

            <button
              type="button"
              className="pressable rounded-2xl bg-[#031B4E] text-gold px-3 py-1.5 text-xs font-black flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Generate Key</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {apiKeys.map((k) => (
              <div
                key={k.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-black uppercase">
                      {k.env}
                    </span>
                    <span className="font-black text-navy dark:text-white">{k.name}</span>
                  </div>
                  <p className="font-mono text-[11px] text-navy/70 dark:text-white/70 mt-1 truncate">
                    {k.token}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyKey(k.token)}
                    className="p-2 rounded-xl bg-slate-200 dark:bg-white/10 text-navy dark:text-white font-bold flex items-center gap-1"
                  >
                    {copiedKey === k.token ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WEBHOOK SUBSCRIPTIONS SECTION */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-5 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
              <Webhook className="h-4 w-4 text-emerald-600" />
              Webhook Subscription Endpoints
            </h2>

            <button
              type="button"
              onClick={handleSendPing}
              className="pressable rounded-2xl bg-emerald-600 text-white px-3.5 py-1.5 text-xs font-black flex items-center gap-1 hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{pingSent ? "Ping Sent (200 OK)!" : "Test Webhook Ping"}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2">
            <p className="font-black text-navy dark:text-white">Endpoint: https://api.merchant-firm.com/webhooks/yike</p>
            <p className="text-[11px] text-navy/60 dark:text-white/60">
              Subscribed Events: <span className="font-bold text-gold">listing.created</span>, <span className="font-bold text-gold">escrow.milestone_funded</span>, <span className="font-bold text-gold">trust.score_updated</span>
            </p>
            <p className="text-[10px] text-navy/50 dark:text-white/50 font-mono">Signing Secret: whsec_98140192841029</p>
          </div>
        </div>

      </div>
    </div>
  );
}

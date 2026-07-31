"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Copy, Plus, Check, ChevronLeft } from "lucide-react";

export function OAuthCredentialsManager() {
  const [apps] = useState([
    {
      id: "APP_101",
      name: "Stankings Property Management CRM",
      clientId: "client_id_live_98140192841029",
      clientSecret: "client_sec_88192049102941",
      redirectUri: "https://crm.stankings.com/oauth/callback",
      scopes: ["read:listings", "write:listings", "read:escrow", "write:webhooks"],
    },
  ]);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  function handleCopy(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-navy/10 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/account/developer" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-navy dark:text-white hover:bg-slate-300">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-navy dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-gold" />
                OAuth 2.0 Client Application Manager
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-0.5">
                Register third-party integration apps, issue client_id and client_secret credentials, and configure redirect URIs.
              </p>
            </div>
          </div>

          <Link href="/developers/scopes" className="rounded-2xl bg-gold text-navy px-4 py-2 text-xs font-black hover:bg-gold-light shrink-0">
            View OAuth Scopes
          </Link>
        </div>

        {/* REGISTER APP BUTTON */}
        <div className="flex justify-end">
          <button
            type="button"
            className="pressable rounded-2xl bg-[#031B4E] text-gold px-4 py-2.5 text-xs font-black flex items-center gap-1.5 shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Register OAuth 2.0 Application</span>
          </button>
        </div>

        {/* OAUTH APPS LIST */}
        <div className="space-y-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2 font-black text-sm text-navy dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>{app.name}</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[9px] font-black uppercase">
                  Active OAuth Client
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="text-[9px] font-sans font-black text-navy/50 dark:text-white/50 uppercase">Client ID</span>
                  <div className="flex items-center justify-between">
                    <span className="text-navy dark:text-gold truncate">{app.clientId}</span>
                    <button type="button" onClick={() => handleCopy(app.clientId)} className="p-1">
                      {copiedToken === app.clientId ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="text-[9px] font-sans font-black text-navy/50 dark:text-white/50 uppercase">Client Secret</span>
                  <div className="flex items-center justify-between">
                    <span className="text-navy dark:text-white truncate">••••••••••••••••••••</span>
                    <button type="button" onClick={() => handleCopy(app.clientSecret)} className="p-1">
                      {copiedToken === app.clientSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                <span className="text-[9px] font-black text-navy/50 dark:text-white/50 uppercase">Allowed Redirect URI</span>
                <p className="font-mono text-[11px] text-navy dark:text-white">{app.redirectUri}</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-navy/50 dark:text-white/50 uppercase">Permitted Scopes</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {app.scopes.map((s, sIdx) => (
                    <span key={sIdx} className="rounded-md bg-gold/20 text-navy dark:text-gold px-2 py-0.5 font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

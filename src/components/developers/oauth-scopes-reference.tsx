"use client";

import { DeveloperSubnav } from "./developer-subnav";
import { Lock, ShieldCheck, Key, Clock } from "lucide-react";

export function OAuthScopesReference() {
  const scopes = [
    { scope: "read:listings", category: "Listings", description: "Read-only access to published property and vehicle listings.", risk: "Low Risk" },
    { scope: "write:listings", category: "Listings", description: "Create, update, or unpublish listings on behalf of merchant.", risk: "Medium Risk" },
    { scope: "read:escrow", category: "Escrow", description: "View active escrow milestone transactions and milestone status.", risk: "Medium Risk" },
    { scope: "write:escrow", category: "Escrow", description: "Approve milestone step handoffs or raise escrow disputes.", risk: "High Risk" },
    { scope: "read:trust", category: "Trust", description: "View user Trust Passport scores, NIN/CAC badges, and audit history.", risk: "Low Risk" },
    { scope: "read:analytics", category: "Business Analytics", description: "Access CRM lead insights, lead scoring, and revenue reporting.", risk: "Medium Risk" },
    { scope: "write:webhooks", category: "Integrations", description: "Register and manage webhook subscription endpoints.", risk: "Low Risk" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Lock className="h-6 w-6 text-gold" />
                OAuth 2.0 Fine-Grained Permission Scopes Registry
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Granular RBAC permission scopes for third-party application authorization and access control.
              </p>
            </div>
          </div>
        </div>

        {/* TOKEN ARCHITECTURE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <Key className="h-4 w-4 text-gold" />
              Short-Lived Access Tokens (1-Hour Expiry)
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              OAuth 2.0 bearer access tokens carry a 1-hour expiration time. Every request header must pass <code className="font-mono bg-black/10 px-1 rounded text-gold">Authorization: Bearer &lt;access_token&gt;</code>.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-lg space-y-2">
            <h3 className="font-black text-sm text-navy dark:text-white flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-purple-600" />
              Refresh Tokens & Rotation (30-Day Expiry)
            </h3>
            <p className="text-[11px] text-navy/70 dark:text-white/70 leading-relaxed">
              Refresh tokens remain valid for 30 days. When refreshing an access token via <code className="font-mono bg-black/10 px-1 rounded text-gold">POST /oauth/token</code>, a new refresh token is issued automatically (Refresh Token Rotation).
            </p>
          </div>
        </div>

        {/* SCOPES TABLE */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-white dark:bg-navy p-6 shadow-xl space-y-4 text-xs">
          <h2 className="text-xs font-black uppercase tracking-wider text-navy dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Fine-Grained Scope Specifications
          </h2>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-navy/50 dark:text-white/50">
                <th className="py-2.5 px-3">Scope Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Scope Description</th>
                <th className="py-2.5 px-3 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-navy dark:text-white">
              {scopes.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  <td className="py-3 px-3 font-mono text-[11px] font-black text-navy dark:text-gold">{s.scope}</td>
                  <td className="py-3 px-3">{s.category}</td>
                  <td className="py-3 px-3 text-[11px] text-navy/70 dark:text-white/70">{s.description}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                      s.risk === "High Risk" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : s.risk === "Medium Risk" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {s.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

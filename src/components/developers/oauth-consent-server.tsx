"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";

export function OAuthConsentServer() {
  const [granted, setGranted] = useState(false);

  const requestedScopes = [
    { scope: "read:listings", description: "View your published property and vehicle listings" },
    { scope: "read:escrow", description: "View active escrow milestone transactions and status" },
    { scope: "write:webhooks", description: "Register webhook endpoints for real-time notification streams" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#031B4E] text-white flex items-center justify-center py-12 px-4 select-none">
      <div className="mx-auto max-w-md w-full rounded-3xl border border-white/10 bg-navy p-6 sm:p-8 shadow-2xl space-y-6 text-xs">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/30">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-black text-white">Authorize Application Access</h1>
          <p className="text-xs text-white/70">
            <strong className="text-gold">Stankings Property CRM</strong> wants to connect to your Yike merchant account.
          </p>
        </div>

        {/* SCOPES LIST */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-gold block">
            Requested Permission Scopes:
          </span>

          <div className="space-y-2">
            {requestedScopes.map((s, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-black text-gold block">{s.scope}</span>
                  <span className="text-[11px] text-white/70">{s.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AUTHORIZATION ACTIONS */}
        {granted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
            <p className="font-black text-sm">Access Authorized!</p>
            <p className="text-[11px] text-white/80">Redirecting back to https://crm.stankings.com/oauth/callback...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setGranted(true)}
              className="pressable w-full py-3 rounded-2xl bg-gold text-navy font-black text-xs uppercase tracking-wider hover:bg-gold-light shadow-lg flex items-center justify-center gap-2"
            >
              <span>Authorize Access</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href="/account/developer"
              className="block w-full py-2.5 text-center text-xs font-bold text-white/60 hover:text-white"
            >
              Cancel & Decline
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

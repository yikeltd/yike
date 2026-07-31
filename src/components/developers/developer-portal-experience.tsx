"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Key, Webhook, ShieldCheck, Cpu, Play, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function DeveloperPortalExperience() {
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    curl: `curl -X GET "https://yike.ng/api/v1/listings?category=property&city=Lagos" \\
  -H "Authorization: Bearer yike_live_84920194821" \\
  -H "Content-Type: application/json"`,
    node: `import { YikeClient } from '@yike/sdk';

const yike = new YikeClient({
  apiKey: process.env.YIKE_API_KEY, // yike_live_...
});

const listings = await yike.listings.list({
  category: 'property',
  city: 'Lagos',
});
console.log(listings);`,
    python: `import yike

client = yike.Client(api_key="yike_live_84920194821")
listings = client.listings.list(category="property", city="Lagos")
print(listings)`,
  };

  const [codeLang, setCodeLang] = useState<"curl" | "node" | "python">("curl");

  function handleCopy() {
    navigator.clipboard.writeText(codeSnippets[codeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-10 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HERO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-8">
          <div className="space-y-2 max-w-2xl">
            <span className="rounded-full bg-gold/20 text-navy dark:text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider">
              Yike Developer Platform v2.0
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-navy dark:text-white tracking-tight">
              Build on Nigeria&apos;s Real Estate & Automotive Infrastructure
            </h1>
            <p className="text-xs sm:text-sm text-navy/70 dark:text-white/70">
              Integrate listings, trust passports, escrow transaction webhooks, and AI lead scoring directly into your software stack.
            </p>
          </div>

          <div className="flex items-center gap-3 font-bold text-xs">
            <Link
              href="/developers/playground"
              className="pressable flex items-center gap-1.5 rounded-2xl bg-gold text-navy px-4 py-2.5 font-black hover:bg-gold-light shadow-md"
            >
              <Play className="h-4 w-4" />
              <span>API Playground</span>
            </Link>
            <Link
              href="/account/developer"
              className="pressable rounded-2xl bg-[#031B4E] text-white px-4 py-2.5 hover:bg-navy-light"
            >
              Get API Keys
            </Link>
          </div>
        </div>

        {/* METRICS & CAPABILITIES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <Key className="h-4 w-4 text-gold" />
            <p className="font-black text-base text-navy dark:text-white">API Keys</p>
            <p className="text-[10px] text-navy/50 dark:text-white/50">Bearer Token Auth</p>
          </div>
          <div className="p-4 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <Webhook className="h-4 w-4 text-emerald-600" />
            <p className="font-black text-base text-navy dark:text-white">Webhooks</p>
            <p className="text-[10px] text-navy/50 dark:text-white/50">Real-Time Event Streams</p>
          </div>
          <div className="p-4 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <Cpu className="h-4 w-4 text-blue-600" />
            <p className="font-black text-base text-navy dark:text-white">Rate Limits</p>
            <p className="text-[10px] text-navy/50 dark:text-white/50">1,000 req / minute</p>
          </div>
          <div className="p-4 rounded-3xl bg-white dark:bg-navy border border-slate-200 dark:border-white/10 shadow-md space-y-1">
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <p className="font-black text-base text-navy dark:text-white">99.9% Uptime</p>
            <p className="text-[10px] text-navy/50 dark:text-white/50">Enterprise SLA</p>
          </div>
        </div>

        {/* CODE EXAMPLES */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-[#031B4E] text-white p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-wider text-gold">
                SDK & API Code Snippet Generator
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              {(["curl", "node", "python"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setCodeLang(lang)}
                  className={cn(
                    "px-3 py-1 rounded-xl uppercase transition-all",
                    codeLang === lang ? "bg-gold text-navy font-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {lang}
                </button>
              ))}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Copy snippet"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-emerald-400 overflow-x-auto">
            <code>{codeSnippets[codeLang]}</code>
          </pre>
        </div>

      </div>
    </div>
  );
}

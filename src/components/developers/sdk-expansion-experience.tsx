"use client";

import { useState } from "react";
import { DeveloperSubnav } from "./developer-subnav";
import { Terminal, Copy, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type SdkLang = "ts" | "python" | "php" | "go" | "java";

export function SdkExpansionExperience() {
  const [selectedLang, setSelectedLang] = useState<SdkLang>("ts");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const sdkPackages: Array<{ id: SdkLang; name: string; installCmd: string; version: string; icon: string }> = [
    { id: "ts", name: "Node.js / TypeScript", installCmd: "npm install @yike/sdk", version: "v1.2.4", icon: "TS" },
    { id: "python", name: "Python SDK", installCmd: "pip install yike", version: "v1.2.0", icon: "PY" },
    { id: "php", name: "PHP / Laravel SDK", installCmd: "composer require yike/yike-php", version: "v1.1.8", icon: "PHP" },
    { id: "go", name: "Go SDK", installCmd: "go get github.com/yikeltd/yike-go", version: "v1.2.1", icon: "GO" },
    { id: "java", name: "Java / Kotlin SDK", installCmd: "implementation 'com.yike:sdk:1.2.0'", version: "v1.0.5", icon: "JV" },
  ];

  const codeSnippets: Record<SdkLang, string> = {
    ts: `import { YikeClient } from '@yike/sdk';

const yike = new YikeClient({
  apiKey: process.env.YIKE_API_KEY, // yike_live_...
});

// Search listings
const properties = await yike.listings.list({
  category: 'property',
  city: 'Lagos',
});

// Verify Webhook Signature
const isValid = yike.webhooks.verifySignature(rawBody, signature, secret);`,

    python: `from yike import YikeClient

client = YikeClient(api_key="yike_live_...")

# Search listings
properties = client.listings.list(category="property", city="Lagos")

# Verify Webhook Signature
is_valid = client.webhooks.verify_signature(raw_body, signature, secret)`,

    php: `use Yike\\YikeClient;

$yike = new YikeClient(getenv('YIKE_API_KEY'));

// Search listings
$properties = $yike->listings->list([
    'category' => 'property',
    'city' => 'Lagos',
]);

// Verify Webhook Signature
$isValid = $yike->webhooks->verifySignature($rawBody, $signature, $secret);`,

    go: `package main

import (
    "fmt"
    "github.com/yikeltd/yike-go"
)

func main() {
    client := yike.NewClient("yike_live_...")
    listings, _ := client.Listings.List(yike.ListParams{Category: "property", City: "Lagos"})
    fmt.Println(listings)
}`,

    java: `import com.yike.sdk.YikeClient;
import com.yike.sdk.models.Listing;

YikeClient client = new YikeClient("yike_live_...");
List<Listing> listings = client.listings().list("property", "Lagos");`,
  };

  function handleCopy(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f9fc] dark:bg-[#021433] text-navy dark:text-white py-8 px-4 sm:px-6 select-none">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER & SUBNAV */}
        <div className="space-y-4">
          <DeveloperSubnav />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-navy dark:text-white flex items-center gap-2">
                <Package className="h-6 w-6 text-gold" />
                Official Yike Developer SDK Reference Hub
              </h1>
              <p className="text-xs text-navy/60 dark:text-white/60 mt-1">
                Official SDK libraries for TypeScript/Node.js, Python, PHP, Go, and Java with built-in retries, signature verification, and type safety.
              </p>
            </div>
          </div>
        </div>

        {/* SDK LIBRARIES SHOWCASE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {sdkPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-5 rounded-3xl border transition-all space-y-3 ${
                selectedLang === pkg.id
                  ? "bg-amber-500/10 dark:bg-gold/10 border-gold shadow-lg"
                  : "bg-white dark:bg-navy border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#031B4E] text-gold font-black text-[10px]">
                    {pkg.icon}
                  </span>
                  <span className="font-black text-navy dark:text-white">{pkg.name}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-navy/50 dark:text-white/50">{pkg.version}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 font-mono text-[10px] text-navy dark:text-gold flex items-center justify-between">
                <span className="truncate">{pkg.installCmd}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(pkg.installCmd)}
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 shrink-0"
                >
                  {copiedCmd === pkg.installCmd ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLang(pkg.id)}
                className="w-full py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 text-navy dark:text-white font-bold text-[11px] hover:bg-slate-300"
              >
                View Code Snippets
              </button>
            </div>
          ))}
        </div>

        {/* CODE SNIPPET GENERATOR */}
        <div className="rounded-3xl border border-navy/10 dark:border-white/10 bg-[#031B4E] text-white p-6 shadow-2xl space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-gold" />
              <h2 className="text-sm font-black uppercase tracking-wider text-gold">
                Interactive Multi-Language SDK Snippets ({selectedLang.toUpperCase()})
              </h2>
            </div>

            <div className="flex items-center gap-1.5 font-bold">
              {sdkPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedLang(pkg.id)}
                  className={cn(
                    "px-3 py-1 rounded-xl text-[11px] uppercase transition-all",
                    selectedLang === pkg.id ? "bg-gold text-navy font-black" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {pkg.id}
                </button>
              ))}
            </div>
          </div>

          <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs text-emerald-400 overflow-x-auto">
            <code>{codeSnippets[selectedLang]}</code>
          </pre>
        </div>

      </div>
    </div>
  );
}

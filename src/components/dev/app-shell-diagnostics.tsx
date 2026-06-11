"use client";

import { useEffect, useState } from "react";
import {
  getAppShellDiagnostics,
  type AppShellDiagnostics,
} from "@/lib/app-shell-diagnostics";

/** Internal TWA/PWA diagnostics — /dev/app-shell */
export function AppShellDiagnosticsPanel() {
  const [data, setData] = useState<AppShellDiagnostics | null>(null);

  useEffect(() => {
    setData(getAppShellDiagnostics());
    void fetch("/.well-known/assetlinks.json", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        setData((prev) =>
          prev
            ? {
                ...prev,
                assetLinksStatus: res.status,
                assetLinksContentType: res.headers.get("content-type"),
                assetLinksPackageFound: Array.isArray(json)
                  ? json.some(
                      (e: { target?: { package_name?: string } }) =>
                        e.target?.package_name === "com.yike.app"
                    )
                  : false,
              }
            : prev
        );
      })
      .catch(() => {
        setData((prev) =>
          prev ? { ...prev, assetLinksStatus: 0, assetLinksContentType: "fetch failed" } : prev
        );
      });
  }, []);

  if (!data) {
    return <p className="text-sm text-muted">Loading diagnostics…</p>;
  }

  const rows: [string, string][] = [
    ["App mode", data.isApp ? "yes (PWA/TWA)" : "no (browser tab)"],
    ["Android TWA referrer", data.isAndroidTwa ? "yes" : "no"],
    ["Display mode (standalone)", data.displayStandalone ? "yes" : "no"],
    ["Display mode (fullscreen)", data.displayFullscreen ? "yes" : "no"],
    ["Display mode (browser)", data.displayBrowser ? "yes" : "no"],
    ["document.referrer", data.referrer || "(empty)"],
    ["window.origin", data.origin],
    ["User agent", data.userAgent],
    ["assetlinks.json HTTP", data.assetLinksStatus ? String(data.assetLinksStatus) : "pending"],
    ["assetlinks content-type", data.assetLinksContentType ?? "pending"],
    ["com.yike.app in assetlinks", data.assetLinksPackageFound ? "yes" : "no / pending"],
    ["HTML class", data.htmlClass],
  ];

  return (
    <dl className="space-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 border-b border-border pb-3">
          <dt className="font-semibold text-navy">{label}</dt>
          <dd className="break-all font-mono text-xs text-muted">{value}</dd>
        </div>
      ))}
      {data.isApp && data.displayBrowser ? (
        <p className="rounded-xl bg-amber-500/15 px-3 py-2 text-xs text-amber-900">
          Browser display-mode inside app shell often means TWA verification failed (Chrome Custom
          Tab fallback). Fix assetlinks + upload new Play Store AAB — CSS cannot hide “Running in
          Chrome”.
        </p>
      ) : null}
    </dl>
  );
}

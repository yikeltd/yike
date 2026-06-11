import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { isProductionEnv } from "@/lib/env";
import { AppShellDiagnosticsPanel } from "@/components/dev/app-shell-diagnostics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "App shell diagnostics",
};

/** TWA/PWA debug — staff only in production. */
export default async function DevAppShellPage() {
  if (isProductionEnv()) {
    await requireAdmin();
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 pb-24">
      <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">Internal</p>
      <h1 className="mt-1 text-2xl font-bold text-navy">App shell diagnostics</h1>
      <p className="mt-2 text-sm text-muted">
        Open this page inside the Play Store app to confirm TWA vs Chrome Custom Tab fallback.
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <AppShellDiagnosticsPanel />
      </div>
      <p className="mt-6 text-xs text-muted">
        CLI: <code className="rounded bg-surface px-1">npm run twa:verify</code> ·{" "}
        <Link href="/dev/emails" className="text-navy underline">
          Email previews
        </Link>
      </p>
    </main>
  );
}

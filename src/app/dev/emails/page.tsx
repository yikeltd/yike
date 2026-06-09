import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { buildEmailPreviewCategories } from "@/lib/email/templates";
import {
  buildSampleEmailAdHtml,
} from "@/lib/email/components/email-ad-block";
import { resolveEmailAdHtml } from "@/lib/email/email-ad";
import { isProductionEnv } from "@/lib/env";
import { createVerifiedAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Staff email template preview — open locally, auth-gated in production. */
export default async function DevEmailsPage() {
  if (isProductionEnv()) {
    await requireAdmin();
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const assetOrigin = `${proto}://${host}`;

  const admin = await createVerifiedAdminClient();
  const liveAd = admin ? await resolveEmailAdHtml(admin) : "";
  const adHtml = liveAd || buildSampleEmailAdHtml();
  const adSource = liveAd
    ? "live ad from /lex/auth/email-ads"
    : "sample preview ad (set SUPABASE_SERVICE_ROLE_KEY to load live)";

  const categories = buildEmailPreviewCategories({ assetOrigin, adHtml });
  const total = categories.reduce((n, c) => n + c.templates.length, 0);

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy">Yike email templates</h1>
          <p className="mt-2 text-sm text-muted">
            Development preview — {total} transactional emails across{" "}
            {categories.length} categories
          </p>
          <p className="mt-2 text-xs text-muted">
            Email sponsor chip: <span className="font-semibold text-navy">{adSource}</span>
            {" · "}
            Manage at{" "}
            <Link href="/lex/auth/email-ads" className="font-semibold text-navy underline">
              /lex/auth/email-ads
            </Link>
          </p>
          <nav className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-navy hover:border-gold/40"
              >
                {cat.label} ({cat.templates.length})
              </a>
            ))}
          </nav>
        </header>

        <div className="space-y-14">
          {categories.map((category) => (
            <div key={category.id} id={category.id} className="scroll-mt-8 space-y-6">
              <h2 className="text-lg font-bold text-navy">{category.label}</h2>
              {category.templates.map((template) => (
                <section
                  key={template.id}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
                >
                  <div className="border-b border-border bg-elevated px-5 py-4">
                    <h3 className="text-base font-bold text-navy">{template.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      Subject:{" "}
                      <span className="font-medium text-foreground">{template.subject}</span>
                    </p>
                  </div>
                  <iframe
                    title={`${template.name} preview`}
                    srcDoc={template.html}
                    className="h-[920px] w-full border-0 bg-white"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                  />
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

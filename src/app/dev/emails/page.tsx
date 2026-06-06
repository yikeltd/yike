import { notFound } from "next/navigation";
import { buildAllEmailPreviews } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

/** Local design review — not available in production. */
export default function DevEmailsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const templates = buildAllEmailPreviews();

  return (
    <div className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy">Yike email templates</h1>
          <p className="mt-2 text-sm text-muted">
            Development preview — {templates.length} transactional emails
          </p>
        </header>

        <div className="space-y-12">
          {templates.map((template) => (
            <section
              key={template.id}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="border-b border-border bg-elevated px-5 py-4">
                <h2 className="text-lg font-bold text-navy">{template.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  Subject: <span className="font-medium text-foreground">{template.subject}</span>
                </p>
              </div>
              <iframe
                title={`${template.name} preview`}
                srcDoc={template.html}
                className="h-[820px] w-full border-0 bg-white"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

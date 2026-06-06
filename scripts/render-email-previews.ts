/**
 * Renders branded email HTML into public/email/previews for design review.
 * Run: npx tsx scripts/render-email-previews.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import { buildAllEmailPreviews } from "../src/lib/email/templates";

const root = process.cwd();
const previewDir = path.join(root, "public/email/previews");

const FILE_MAP: Record<string, string> = {
  email_verification: "01-email-verification.html",
  welcome: "02-welcome.html",
  password_reset: "03-password-reset.html",
  account_deleted: "04-account-deleted.html",
  agent_verification_submitted: "05-agent-submitted.html",
  agent_verification_approved: "06-agent-approved.html",
  agent_verification_rejected: "07-agent-rejected.html",
  listing_submitted: "08-listing-submitted.html",
  listing_approved: "09-listing-approved.html",
  listing_rejected: "10-listing-rejected.html",
  report_received: "11-report-received.html",
  admin_alert_report: "12-admin-report.html",
  admin_alert_listing: "13-admin-listing.html",
  admin_alert_agent: "14-admin-agent.html",
};

/** Rewrite production URLs so static previews work from /email/previews/. */
function localizePreviewHtml(html: string): string {
  return html
    .replaceAll("https://yike.ng/email/social/", "../social/")
    .replaceAll("https://yike.ng/email/badges/", "../badges/")
    .replaceAll("https://yike.ng/images/", "../../images/")
    .replaceAll("https://yike.ng/icons/", "../../icons/");
}

async function writePreviewIndex(
  templates: ReturnType<typeof buildAllEmailPreviews>
) {
  const links = templates
    .map((t) => {
      const file = FILE_MAP[t.id] ?? `${t.id}.html`;
      return `<li><a href="./${file}" style="color:#031B4E;font-weight:600;">${t.category}: ${t.name}</a></li>`;
    })
    .join("\n");

  const index = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Yike email previews</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f4f6f9; margin: 0; padding: 32px 20px; color: #031B4E; }
    main { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 28px 32px; border: 1px solid #e2e8f0; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { color: #64748b; line-height: 1.5; }
    ul { margin: 20px 0 0; padding-left: 20px; line-height: 2; }
  </style>
</head>
<body>
  <main>
    <h1>Yike transactional emails</h1>
    <p>${templates.length} templates — also preview live at <code>/dev/emails</code> in development.</p>
    <ul>${links}</ul>
  </main>
</body>
</html>`;

  await fs.writeFile(path.join(previewDir, "index.html"), index, "utf8");
  console.log("wrote", path.relative(root, path.join(previewDir, "index.html")));
}

async function main() {
  await fs.mkdir(previewDir, { recursive: true });
  const templates = buildAllEmailPreviews();

  for (const template of templates) {
    const filename = FILE_MAP[template.id] ?? `${template.id}.html`;
    const out = path.join(previewDir, filename);
    await fs.writeFile(out, localizePreviewHtml(template.html), "utf8");
    console.log("wrote", path.relative(root, out));
  }

  await writePreviewIndex(templates);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

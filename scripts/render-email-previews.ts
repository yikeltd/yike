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
  admin_alert: "03-admin-alert.html",
};

/** Rewrite production URLs so static previews work from /email/previews/. */
function localizePreviewHtml(html: string): string {
  return html
    .replaceAll("https://yike.ng/email/social/", "../social/")
    .replaceAll("https://yike.ng/images/", "../../images/")
    .replaceAll("https://yike.ng/icons/", "../../icons/");
}

async function main() {
  await fs.mkdir(previewDir, { recursive: true });

  for (const template of buildAllEmailPreviews()) {
    const filename = FILE_MAP[template.id] ?? `${template.id}.html`;
    const out = path.join(previewDir, filename);
    await fs.writeFile(out, localizePreviewHtml(template.html), "utf8");
    console.log("wrote", path.relative(root, out));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

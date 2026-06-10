import {
  buildCtaButton,
  buildFallbackLink,
  buildInfoCard,
  emailSecondary,
} from "@/lib/email/components";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";
import { SITE_URL } from "@/lib/constants";

type AdminAlertCta = { label: string; href: string };

function adminReviewLabel(path: string): string {
  if (path.includes("property-verifications")) return "Review verification";
  if (path.includes("careers")) return "Review application";
  if (path.includes("legal-partners")) return "Review legal request";
  if (path.includes("inspections")) return "Review inspection";
  if (path.includes("reports")) return "Review report";
  if (path.includes("agents")) return "Review agent";
  if (path.includes("listings")) return "Review listing";
  return "Open in staff console";
}

function toAbsoluteAdminUrl(path: string): string {
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${SITE_URL.replace(/\/$/, "")}${normalized}`;
}

function extractReviewCta(body: string): { body: string; cta?: AdminAlertCta } {
  const match = body.match(/\n\nReview:\s*([^\n]+)/);
  if (!match) return { body };

  const path = match[1].trim();
  const cleanBody = body.replace(/\n\nReview:\s*[^\n]+/, "").trimEnd();
  const href = toAbsoluteAdminUrl(path);

  return {
    body: cleanBody,
    cta: { label: adminReviewLabel(path), href },
  };
}

export function buildAdminAlertEmailHtml(params: {
  subject: string;
  body: string;
  cta?: AdminAlertCta;
}): string {
  const parsed = extractReviewCta(params.body);
  const cta = params.cta ?? parsed.cta;
  const bodyHtml = escapeHtml(parsed.body).replace(/\n/g, "<br />");

  const actionHtml = cta
    ? `${buildCtaButton({ label: cta.label, href: cta.href })}${buildFallbackLink({
        label: "Or open this link:",
        href: cta.href,
      })}`
    : "";

  return buildEmailLayout({
    preheader: params.subject,
    headline: escapeHtml(params.subject),
    bodyHtml: `
      ${emailSecondary("Internal admin notification from Yike.")}
      ${buildInfoCard({ content: bodyHtml })}
      ${actionHtml}
    `,
    showSupport: false,
  });
}

import { buildInfoCard, emailSecondary } from "@/lib/email/components";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildAdminAlertEmailHtml(params: {
  subject: string;
  body: string;
}): string {
  const body = escapeHtml(params.body).replace(/\n/g, "<br />");

  return buildEmailLayout({
    preheader: params.subject,
    headline: escapeHtml(params.subject),
    bodyHtml: `
      ${emailSecondary("Internal admin notification from Yike.")}
      ${buildInfoCard({ content: body })}
    `,
    showSupport: false,
  });
}

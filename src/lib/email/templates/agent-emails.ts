import { SITE_URL } from "@/lib/constants";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildAgentVerificationSubmittedEmailHtml(params: {
  fullName: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "Your agent verification application is under review.",
    headline: "Application received",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Thanks for applying to become a verified agent on Yike. Our team will review your documents
        within 1–2 business days.
      </p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        You&apos;ll get another email when your application is approved or if we need anything else.
      </p>
    `,
    cta: { label: "View application status", href: `${SITE_URL}/agent/verification` },
  });
}

export function buildAgentVerificationApprovedEmailHtml(params: {
  fullName: string;
}): string {
  const name = escapeHtml(params.fullName || "there");

  return buildEmailLayout({
    preheader: "You're now a verified agent on Yike.",
    headline: "You're verified",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        Great news — your agent verification was approved. Your verified badge is live and you can
        post unlimited listings on Yike.
      </p>
    `,
    cta: { label: "Post a listing", href: `${SITE_URL}/agent/listings/new` },
  });
}

export function buildAgentVerificationRejectedEmailHtml(params: {
  fullName: string;
  reason?: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const reason = escapeHtml(
    params.reason?.trim() || "Your documents did not meet our verification requirements."
  );

  return buildEmailLayout({
    preheader: "Update on your Yike agent verification application.",
    headline: "Application not approved",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 16px;">
        We reviewed your agent verification application but couldn&apos;t approve it this time.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:16px 18px;font-size:14px;line-height:1.55;color:#334155;">
            <strong style="color:#031B4E;">Reason:</strong> ${reason}
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;color:#64748b;font-size:14px;">
        You can correct your details and resubmit from your verification page.
      </p>
    `,
    cta: { label: "Resubmit verification", href: `${SITE_URL}/agent/verification` },
  });
}

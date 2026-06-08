import {
  buildCtaButton,
  emailGreeting,
  emailParagraph,
  emailSecondary,
} from "@/lib/email/components";
import { buildInfoCard } from "@/lib/email/components/info-card";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";
import { STAFF_ONBOARDING_EMAIL_SUBJECT } from "@/lib/admin/staff-onboarding/constants";

function credentialRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:15px;font-weight:600;color:#031B4E;font-family:ui-monospace,monospace;">${escapeHtml(value)}</td>
  </tr>`;
}

export function staffOnboardingEmailSubject(): string {
  return STAFF_ONBOARDING_EMAIL_SUBJECT;
}

export function buildStaffOnboardingEmailHtml(params: {
  fullName: string;
  roleLabel: string;
  department: string;
  welcomeNote?: string;
  yikeLoginEmail: string;
  yikeTempPassword: string;
  yikeLoginUrl: string;
  workEmail: string;
  zohoTempPassword: string;
  zohoLoginUrl: string;
  instructions?: string;
  supportEmail?: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const role = escapeHtml(params.roleLabel);
  const dept = escapeHtml(params.department);
  const welcome =
    params.welcomeNote?.trim() ||
    "Welcome to Yike. We're excited to have you on the team.";

  const instructionsBlock = params.instructions?.trim()
    ? buildInfoCard({
        label: "Your instructions",
        content: escapeHtml(params.instructions).replace(/\n/g, "<br/>"),
      })
    : "";

  const yikeCreds = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
      ${credentialRow("Email", params.yikeLoginEmail)}
      ${credentialRow("Temporary password", params.yikeTempPassword)}
    </table>
  `;

  const zohoCreds = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
      ${credentialRow("Work email", params.workEmail)}
      ${credentialRow("Temporary password", params.zohoTempPassword)}
    </table>
  `;

  const support = escapeHtml(params.supportEmail ?? "hello@yike.ng");

  return buildEmailLayout({
    preheader: "Your Yike Crew access — Yike login and Zoho work email inside.",
    headline: "Welcome to Yike Crew",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(escapeHtml(welcome))}
      ${buildInfoCard({
        label: "Your role",
        content: `<strong>${role}</strong> · ${dept}`,
      })}
      ${buildInfoCard({
        label: "Yike staff login",
        content: `${yikeCreds}${buildCtaButton({ label: "Open Yike staff login", href: params.yikeLoginUrl })}`,
      })}
      ${buildInfoCard({
        label: "Zoho work email",
        content: `${zohoCreds}${buildCtaButton({ label: "Open Zoho Mail", href: params.zohoLoginUrl })}`,
      })}
      ${instructionsBlock}
      ${emailSecondary(
        `Change both passwords after your first login. For help, email ${support}.`
      )}
    `,
  });
}

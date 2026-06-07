import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";

export function buildEmailOtpHtml(params: {
  fullName: string;
  code: string;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const code = escapeHtml(params.code);

  return buildEmailLayout({
    preheader: `Your Yike verification code is ${params.code}`,
    headline: "Your Yike verification code",
    headlineAlign: "center",
    bodyHtml: `
      <p style="margin:0 0 16px;">Hi ${name},</p>
      <p style="margin:0 0 20px;">Your Yike verification code is:</p>
      <p style="margin:0 0 24px;text-align:center;font-size:32px;font-weight:800;letter-spacing:0.35em;color:#031B4E;">
        ${code}
      </p>
      <p style="margin:0 0 12px;color:#64748b;font-size:14px;">
        This code expires in 10 minutes.
      </p>
      <p style="margin:0;color:#64748b;font-size:14px;">
        If you didn&apos;t request this, you can safely ignore this email.
      </p>
    `,
  });
}

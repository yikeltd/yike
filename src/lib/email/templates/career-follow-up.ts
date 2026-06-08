import { buildEmailLayout } from "./layout";
import { emailGreeting, emailParagraph, emailSecondary } from "@/lib/email/components";
import { escapeHtml } from "./utils";

export function buildCareerFollowUpEmailHtml(params: {
  fullName: string;
  jobTitle: string;
  followUpUrl: string;
  expiresDays: number;
}): string {
  const name = escapeHtml(params.fullName || "there");
  const role = escapeHtml(params.jobTitle);
  const days = params.expiresDays;

  return buildEmailLayout({
    preheader: "Complete a short follow-up so we can understand your fit before interview.",
    headline: "Application follow-up",
    headlineAlign: "center",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph(
        `Thank you again for applying to <strong>${role}</strong> at Yike.`
      )}
      ${emailParagraph(
        "We liked your application and would like a short follow-up before any video interview. It helps us understand your experience, availability, and how you think."
      )}
      ${emailSecondary(`This link expires in ${days} days. You can complete it in one sitting — most people finish in 10–15 minutes.`)}
    `,
    cta: { label: "Complete follow-up", href: params.followUpUrl },
  });
}

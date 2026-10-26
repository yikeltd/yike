import {
  buildCtaButton,
  buildOutlineCtaButton,
  emailGreeting,
  emailParagraph,
} from "@/lib/email/components";
import { buildEmailLayout } from "./layout";
import { escapeHtml } from "./utils";
import { emailGreetingName } from "@/lib/email/name";
import { SITE_URL } from "@/lib/constants";

export const FOUNDER_WELCOME_SUBJECT = "Welcome to Yike ❤️";

const FOLLOW_X_URL = "https://x.com/odogwustankings";
const WHATSAPP_CHANNEL_URL =
  "https://www.whatsapp.com/channel/0029VbDK3aJBadmUe1X5I12h";

export function buildFounderWelcomeEmailHtml(params: {
  fullName?: string | null;
  username?: string | null;
}): string {
  const name = escapeHtml(emailGreetingName(params.fullName, params.username));

  return buildEmailLayout({
    preheader: "A personal welcome from Odogwu Stankings, founder of Yike.",
    headline: "Welcome to Yike ❤️",
    headlineAlign: "left",
    bodyHtml: `
      ${emailGreeting(name)}
      ${emailParagraph("<strong>Welcome to Yike ❤️</strong>")}
      ${emailParagraph(
        "I&rsquo;m <strong>Odogwu Stankings</strong>, founder of Yike, and I wanted to personally thank you for joining us."
      )}
      ${emailParagraph(
        "We built Yike to make finding, listing, and verifying property and vehicles in Nigeria easier, safer, and more trustworthy &mdash; without the usual stress, scams, or endless back-and-forth."
      )}
      ${emailParagraph(
        "Whether you&rsquo;re searching for your next home or car, listing inventory, or growing your business on Yike, we&rsquo;re excited to have you here."
      )}
      ${buildCtaButton({
        label: "Browse listings",
        href: `${SITE_URL}/search`,
        align: "left",
      })}
      ${emailParagraph("<strong>Follow the journey:</strong>")}
      ${buildCtaButton({ label: "Follow on X", href: FOLLOW_X_URL, align: "left" })}
      ${buildOutlineCtaButton({
        label: "Join WhatsApp Channel",
        href: WHATSAPP_CHANNEL_URL,
        align: "left",
      })}
      ${emailParagraph(
        "If you ever need help or want to share feedback, just reply to this email. We&rsquo;re always listening."
      )}
      ${emailParagraph(
        "Warm regards,<br /><strong>Odogwu Stankings</strong><br />Founder, Yike"
      )}
    `,
  });
}

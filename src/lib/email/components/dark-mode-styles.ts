import { emailTokens as t } from "./tokens";

/** Inline + head styles for Gmail/Apple Mail dark mode readability. */
export function buildDarkModeStyles(): string {
  return `
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body-pad { padding: 24px 20px !important; }
      .email-footer { padding: 20px 20px 28px !important; }
      .email-header { padding: 24px 20px 20px !important; }
      .email-otp-digit { font-size: 28px !important; min-width: 34px !important; }
    }

    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: ${t.navyDark} !important; }
      .email-shell { background-color: #0c1424 !important; border-color: #1e293b !important; }
      .email-header { background-color: #0c1424 !important; }
      .email-body-pad { background-color: #0c1424 !important; }
      .email-footer { background-color: #081018 !important; border-color: #1e293b !important; }
      .email-brand { color: #f8fafc !important; }
      .email-headline { color: #f8fafc !important; }
      .email-text { color: #e2e8f0 !important; }
      .email-secondary { color: #94a3b8 !important; }
      .email-muted { color: #64748b !important; }
      .email-link { color: ${t.gold} !important; }
      .email-otp-shell { background-color: #111827 !important; border-color: #334155 !important; }
      .email-otp-digit { color: #f8fafc !important; }
      .email-card { background-color: #111827 !important; border-color: #334155 !important; }
      .email-alert { border-color: #334155 !important; }
      .email-cta { background-color: ${t.gold} !important; }
      .email-cta a { color: ${t.navy} !important; }
      .email-support { border-color: #334155 !important; }
    }

    [data-ogsc] .email-bg { background-color: ${t.navyDark} !important; }
    [data-ogsc] .email-shell { background-color: #0c1424 !important; }
    [data-ogsc] .email-text { color: #e2e8f0 !important; }
    [data-ogsc] .email-headline { color: #f8fafc !important; }
  `.trim();
}

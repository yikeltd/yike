import { emailTokens as t } from "./tokens";

/** Inline + head styles for Gmail/Apple Mail dark mode readability. */
export function buildDarkModeStyles(): string {
  return `
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-body-pad { padding: 28px 20px 24px !important; }
      .email-footer-dark { padding: 28px 20px 24px !important; }
      .email-header { padding: 28px 20px 24px !important; }
      .email-otp-code { font-size: 34px !important; letter-spacing: 0.04em !important; }
    }

    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: ${t.navyDark} !important; }
      .email-shell { background-color: #0c1424 !important; border-color: #1e293b !important; }
      .email-body-pad { background-color: #0c1424 !important; }
      .email-headline { color: #f8fafc !important; }
      .email-tagline { color: ${t.gold} !important; }
      .email-text { color: #e2e8f0 !important; }
      .email-secondary { color: #94a3b8 !important; }
      .email-muted { color: #64748b !important; }
      .email-link { color: ${t.gold} !important; }
      .email-otp-shell { background: #0c1424 !important; border-color: #334155 !important; }
      .email-otp-field { background: #111827 !important; border-color: #334155 !important; }
      .email-otp-code { color: #f8fafc !important; }
      .email-card { background-color: #111827 !important; border-color: #334155 !important; }
      .email-alert { background: #111827 !important; border-color: #334155 !important; }
      .email-cta { background-color: ${t.gold} !important; }
      .email-cta a { color: ${t.navy} !important; }
      .email-support { border-color: #334155 !important; }
      .email-ad { background: #111827 !important; border-color: #334155 !important; }
    }

    [data-ogsc] .email-bg { background-color: ${t.navyDark} !important; }
    [data-ogsc] .email-shell { background-color: #0c1424 !important; }
    [data-ogsc] .email-text { color: #e2e8f0 !important; }
    [data-ogsc] .email-headline { color: #f8fafc !important; }
    [data-ogsc] .email-otp-code { color: #f8fafc !important; }
  `.trim();
}

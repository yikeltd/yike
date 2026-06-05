import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import { REPORT_REASONS } from "@/lib/constants";
import {
  LegalCallout,
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Moderation & Reporting Policy",
  description: `How ${SITE_NAME} moderates listings, handles reports, and keeps the marketplace trustworthy.`,
};

export default function ModerationPage() {
  return (
    <LegalDocument title="Moderation & Reporting Policy" lastUpdated="5 June 2026">
      <LegalCallout>
        {SITE_NAME} is trust-first. We combine community reports, automated checks,
        and human review to remove fake, misleading, or harmful listings.
      </LegalCallout>

      <LegalSection title="1. What we moderate">
        <ul>
          <li>Property listings (photos, price, location, availability)</li>
          <li>Agent and lister profiles (verification documents)</li>
          <li>User reports and safety flags</li>
          <li>Suspected duplicate images or repeated scam patterns</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Prohibited content">
        <ul>
          <li>Fake, bait, or unavailable properties</li>
          <li>Call-for-price or intentionally misleading pricing</li>
          <li>Duplicate or recycled listings across accounts</li>
          <li>Blurry, stock, or unrelated photos</li>
          <li>Inspection-fee scams or requests for payment before viewing</li>
          <li>Harassment, hate speech, or illegal activity</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How to report a listing">
        <p>On any listing page, tap <strong>Report this listing</strong> and choose a reason:</p>
        <ul>
          {REPORT_REASONS.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p>
          Reports go to our moderation queue. Urgent fraud reports can also be
          emailed to{" "}
          <a href="mailto:hello@yike.ng" className="font-semibold text-gold-dark underline">
            hello@yike.ng
          </a>{" "}
          with the listing link and screenshots.
        </p>
      </LegalSection>

      <LegalSection title="4. Review process">
        <ol>
          <li>Report received → triaged by severity (scam reports prioritised).</li>
          <li>Listing may be hidden pending review.</li>
          <li>Admin approves, edits, or permanently removes the listing.</li>
          <li>Repeat offenders may be banned from posting.</li>
        </ol>
        <p>
          Typical review time: <strong>24–72 hours</strong> on business days.
          High-risk reports are handled faster.
        </p>
      </LegalSection>

      <LegalSection title="5. Lister verification">
        <p>
          Users who post properties must complete identity verification (NIN +
          selfie review). Unverified accounts cannot publish listings. See{" "}
          <Link href="/verify-agent" className="font-semibold text-gold-dark underline">
            verification
          </Link>{" "}
          and{" "}
          <Link href="/safety" className="font-semibold text-gold-dark underline">
            safety tips
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Appeals">
        <p>
          If your listing or account was actioned in error, email hello@yike.ng
          with your account email, listing ID, and evidence. We aim to respond
          within 7 business days.
        </p>
      </LegalSection>

      <LegalSection title="7. Law enforcement">
        <p>
          We cooperate with valid legal requests from Nigerian authorities where
          required. Report serious fraud to EFCC/Police in addition to notifying
          Yike.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

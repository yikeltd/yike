import { SITE_NAME, SITE_URL } from "@/lib/constants";
import {
  LegalCallout,
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and protects personal data under Nigerian law.`,
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="5 June 2026">
      <LegalCallout>
        This policy explains how {SITE_NAME} (&quot;we&quot;) handles personal
        data when you use {SITE_URL}. We aim to comply with the Nigeria Data
        Protection Act 2023 (NDPA) and applicable regulations.
      </LegalCallout>

      <LegalSection title="1. Data controller">
        <p>
          {SITE_NAME} is the data controller for personal data processed through
          the platform. Contact: hello@yike.ng (see our Contact page).
        </p>
      </LegalSection>

      <LegalSection title="2. Data we collect">
        <ul>
          <li>
            <strong>Account data:</strong> name, email, phone, WhatsApp number,
            profile photo, agent type, verification documents (for agents).
          </li>
          <li>
            <strong>Listing data:</strong> property descriptions, photos,
            videos, location hints, pricing.
          </li>
          <li>
            <strong>Usage data:</strong> pages viewed, searches, device type,
            approximate location from IP, cookies (see Cookie Policy).
          </li>
          <li>
            <strong>Communications:</strong> reports, support messages, moderation notes.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use data">
        <ul>
          <li>Operate the marketplace and display listings.</li>
          <li>Verify agents and moderate content.</li>
          <li>Improve search, safety features, and product experience.</li>
          <li>Send service-related messages (not sold as raw contact lists).</li>
          <li>Comply with law and respond to valid legal requests.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Legal bases (NDPA)">
        <p>We process data based on:</p>
        <ul>
          <li>Your consent (e.g. marketing where applicable).</li>
          <li>Contract — providing the service you signed up for.</li>
          <li>Legitimate interests — fraud prevention, analytics, security.</li>
          <li>Legal obligation — court orders, regulatory requirements.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Sharing">
        <p>We may share data with:</p>
        <ul>
          <li>
            Infrastructure providers (hosting, database, analytics) under
            confidentiality obligations.
          </li>
          <li>
            Other users — your public profile and listings are visible to
            visitors; WhatsApp/phone contact is shared when users choose to
            contact you.
          </li>
          <li>Authorities when required by law or to prevent serious harm.</li>
        </ul>
        <p>We do not sell personal data.</p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          We keep data while your account is active and for a reasonable period
          afterward for legal, safety, and backup purposes. Listing reports and
          verification records may be retained longer where needed for disputes.
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use encryption in transit, access controls, and industry-standard
          hosting. No system is 100% secure — report suspected breaches to
          hello@yike.ng promptly.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>Under NDPA, you may have rights to:</p>
        <ul>
          <li>Access and receive a copy of your data.</li>
          <li>Correct inaccurate data.</li>
          <li>Request deletion (subject to legal retention needs).</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent where processing is consent-based.</li>
          <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC).</li>
        </ul>
        <p>
          To exercise rights, email hello@yike.ng with proof of identity. We
          respond within statutory timelines.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          {SITE_NAME} is not directed at under-18s. We do not knowingly collect
          children&apos;s data for marketing.
        </p>
      </LegalSection>

      <LegalSection title="10. International transfers">
        <p>
          Data may be processed on servers outside Nigeria (e.g. cloud
          providers). We use providers with appropriate safeguards where
          required.
        </p>
      </LegalSection>

      <LegalSection title="11. Updates">
        <p>
          We will post changes on this page. Significant updates may be
          communicated in-app or by email where appropriate.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

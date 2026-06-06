import { SITE_NAME, SITE_URL, COMPANY_LEGAL_NAME, COMPANY_RC, COMPANY_EMAIL } from "@/lib/constants";
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
    <LegalDocument title="Privacy Policy" lastUpdated="6 June 2026">
      <LegalCallout>
        {COMPANY_LEGAL_NAME} ({COMPANY_RC}) operates {SITE_NAME} at {SITE_URL}.
        This policy explains how we handle personal data under the Nigeria Data
        Protection Act 2023 (NDPA).
      </LegalCallout>

      <LegalSection title="1. Data controller">
        <p>
          {COMPANY_LEGAL_NAME} ({COMPANY_RC}) is the data controller. Contact:{" "}
          <a href={`mailto:${COMPANY_EMAIL}`} className="font-semibold text-gold-dark">
            {COMPANY_EMAIL}
          </a>
          .
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
            <strong>Lead &amp; contact data:</strong> when you tap WhatsApp or
            call on a listing, we log the interaction (listing, agent, reference
            ID, page source, approximate device info) to improve lead quality
            and agent analytics. Your phone number is not required to browse.
          </li>
          <li>
            <strong>Approximate location:</strong> city/area preferences from
            searches and views; coarse location may be inferred from IP for
            relevance — we do not track precise GPS in the current app.
          </li>
          <li>
            <strong>Usage data:</strong> pages viewed, searches, saves, swipe
            activity, device type, cookies (see Cookie Policy).
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
        <p>
          <strong>Delete your account:</strong> use our{" "}
          <a href="/account/delete" className="font-semibold text-gold-dark underline">
            account deletion page
          </a>{" "}
          while signed in, or from Profile → Delete account in the app.
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
      <LegalSection title="12. Google Play &amp; app stores">
        <p>
          If you install Yike from Google Play, the Android app is a Trusted Web
          Activity wrapper around {SITE_URL} — the same privacy practices apply.
          Data collected matches the categories above and is used to connect
          renters with local agents, personalize listings, and improve trust and
          safety.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

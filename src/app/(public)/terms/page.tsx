import { SITE_NAME, SITE_URL, COMPANY_LEGAL_NAME, COMPANY_RC } from "@/lib/constants";
import {
  LegalCallout,
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Terms of Service",
  description: `Terms governing use of ${SITE_NAME}, Nigeria's housing marketplace.`,
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="6 June 2026">
      <LegalCallout>
        By using {SITE_NAME} at {SITE_URL}, you agree to these Terms.{" "}
        {COMPANY_LEGAL_NAME} ({COMPANY_RC}) operates the platform.
      </LegalCallout>

      <LegalSection title="1. Who we are">
        <p>
          {COMPANY_LEGAL_NAME} ({COMPANY_RC}) operates {SITE_NAME} (&quot;Yike&quot;,
          &quot;we&quot;, &quot;us&quot;) — an online marketplace helping users
          discover property listings in Nigeria. We are a technology platform,
          not an estate agent, property developer, lawyer, or financial
          institution.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <ul>
          <li>You must be at least 18 years old to list property or enter binding agreements.</li>
          <li>You must provide accurate information when registering as an agent or user.</li>
          <li>You must comply with Nigerian law, including anti-fraud and consumer protection rules.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Listings and agents">
        <ul>
          <li>
            Agents and landlords are solely responsible for the accuracy of
            listings, photos, prices, availability, and their authority to
            market the property.
          </li>
          <li>
            Yike may review, approve, reject, hide, or remove listings at our
            discretion — including for suspected fraud, duplicate posts, or
            policy violations.
          </li>
          <li>
            A &quot;Verified&quot; badge indicates identity checks we perform;
            it is not a guarantee of property condition, title, or agent conduct.
          </li>
          <li>
            Listings expire automatically unless renewed. &quot;Featured&quot;
            placement may be paid or editorial.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. No payments through Yike">
        <p>
          Yike does not process rent, sale deposits, inspection fees, or
          escrow in the current version of the platform. All payments are
          arranged directly between users and agents/landlords. We strongly
          advise against paying large sums before physically inspecting a
          property and verifying documentation.
        </p>
      </LegalSection>

      <LegalSection title="5. User conduct">
        <p>You agree not to:</p>
        <ul>
          <li>Post false, misleading, or duplicate listings.</li>
          <li>Impersonate another person or agency.</li>
          <li>Harass users or use the platform for unrelated spam or scams.</li>
          <li>Scrape, reverse-engineer, or overload our systems without permission.</li>
          <li>Circumvent moderation, bans, or reporting systems.</li>
        </ul>
        <p>
          See our{" "}
          <a href="/moderation" className="font-semibold text-gold-dark underline">
            Moderation &amp; Reporting Policy
          </a>{" "}
          for how reports are handled.
        </p>
      </LegalSection>

      <LegalSection title="5b. Account deletion">
        <p>
          You may delete your account at any time from{" "}
          <a href="/account/delete" className="font-semibold text-gold-dark underline">
            yike.ng/account/delete
          </a>
          . Deletion is permanent and removes your profile and listings from the
          marketplace, subject to legal retention described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>
          Yike&apos;s brand, software, and design are our property. By uploading
          listing media, you grant us a non-exclusive licence to display and
          promote that content on {SITE_NAME} and related channels.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimers and limitation of liability">
        <p>
          The platform is provided &quot;as is&quot;. To the fullest extent
          permitted by Nigerian law, Yike is not liable for losses arising from
          off-platform dealings, property defects, title disputes, agent
          misconduct, or reliance on listing information. Our total liability to
          you for platform-related claims is limited to the amount you paid us
          in the twelve months before the claim (typically zero for free users).
        </p>
      </LegalSection>

      <LegalSection title="8. Indemnity">
        <p>
          You agree to indemnify Yike against claims arising from your listings,
          your conduct, or your breach of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Suspension and termination">
        <p>
          We may suspend or terminate accounts that violate these Terms or pose
          risk to other users. You may stop using the service at any time.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law">
        <p>
          These Terms are governed by the laws of the Federal Republic of
          Nigeria. Disputes shall be subject to the exclusive jurisdiction of
          Nigerian courts, unless mandatory consumer law provides otherwise.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>
          We may update these Terms. Material changes will be posted on this
          page with a new &quot;Last updated&quot; date. Continued use after
          changes constitutes acceptance.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

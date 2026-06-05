import { SITE_NAME } from "@/lib/constants";
import {
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Cookie Policy",
  description: `How ${SITE_NAME} uses cookies and similar technologies.`,
};

export default function CookiesPage() {
  return (
    <LegalDocument title="Cookie Policy" lastUpdated="5 June 2026">
      <LegalSection title="What are cookies?">
        <p>
          Cookies are small text files stored on your device. We also use
          similar technologies (local storage, session storage) for preferences
          and app functionality.
        </p>
      </LegalSection>

      <LegalSection title="How we use them">
        <ul>
          <li>
            <strong>Essential:</strong> keep you signed in, secure sessions,
            remember PWA install choices.
          </li>
          <li>
            <strong>Preferences:</strong> theme (light/dark), recent searches
            stored locally on your device.
          </li>
          <li>
            <strong>Analytics (if enabled):</strong> understand usage to improve
            search and performance — aggregated where possible.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Third parties">
        <p>
          Hosting and authentication providers may set their own cookies. Sponsored
          ad partners linked from our site may set cookies on their domains when
          you click through — see their policies.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul>
          <li>Clear cookies via browser settings (may log you out).</li>
          <li>Disable non-essential cookies in browser where supported.</li>
          <li>
            Uninstall or clear site data for the {SITE_NAME} PWA to reset local
            storage.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="More information">
        <p>
          For how we process personal data, see our Privacy Policy. Contact
          hello@yike.ng with cookie-related questions.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

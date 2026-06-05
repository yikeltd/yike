import { SITE_NAME, SITE_URL } from "@/lib/constants";
import {
  LegalCallout,
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";

export const metadata = {
  title: "Disclaimer",
  description: `Important limitations and risk notices for ${SITE_NAME} users in Nigeria.`,
};

export default function DisclaimerPage() {
  return (
    <LegalDocument title="Disclaimer" lastUpdated="5 June 2026">
      <LegalCallout>
        <strong>Read this carefully.</strong> Nigeria&apos;s property market
        carries real fraud and title risks. {SITE_NAME} helps you discover
        listings — we do not replace your own due diligence, legal advice, or
        physical inspections.
      </LegalCallout>

      <LegalSection title="Platform role">
        <p>
          {SITE_NAME} ({SITE_URL}) is an online listing and discovery platform
          only. We are not:
        </p>
        <ul>
          <li>An estate agent, realtor, or property manager.</li>
          <li>A party to any rent, sale, or lease agreement between users.</li>
          <li>A holder of client money, rent, caution deposits, or escrow.</li>
          <li>A guarantor of property title, habitability, or agent honesty.</li>
          <li>A substitute for a qualified Nigerian property lawyer or surveyor.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Listing accuracy">
        <p>
          Prices, availability, photos, and descriptions are supplied by
          agents and landlords. They may be outdated, exaggerated, or wrong.
          Always confirm on site before paying. Use the &quot;Already
          rented?&quot; report if a listing appears stale.
        </p>
      </LegalSection>

      <LegalSection title="Verification limits">
        <p>
          Agent verification and listing badges reduce risk but do not eliminate
          it. Criminals may use stolen identities or fake documents. Verify
          agency affiliation, ask for office address, and meet at the actual
          property — not a different unit.
        </p>
        <p className="mt-3">
          <strong>Yike does not verify property ownership</strong> — we do not
          review C of O, deed of assignment, survey plans or landlord authority
          for rental listings. Identity checks on agents are not a guarantee that
          a specific unit is available or legally let.
        </p>
      </LegalSection>

      <LegalSection title="Payments and scams">
        <p>
          Common scams in Nigeria include:
        </p>
        <ul>
          <li>Upfront &quot;inspection&quot; or &quot;agency&quot; fees before viewing.</li>
          <li>Pressure to pay via transfer to personal accounts without receipts.</li>
          <li>Listings for properties the poster does not control.</li>
          <li>Fake title documents (C of O, deed of assignment, survey plans).</li>
        </ul>
        <p>
          {SITE_NAME} never asks you to pay rent or deposits through the website.
          If someone claims to be &quot;Yike staff&quot; requesting money, it is
          fraud — report to us and relevant authorities (including EFCC/Police
          where appropriate).
        </p>
      </LegalSection>

      <LegalSection title="Land and documentation">
        <p>
          For land sales and leases, engage a lawyer to conduct title search,
          confirm survey coordinates, check government approvals, and draft
          agreements. &quot;Family land&quot; and communal disputes are common —
          verbal assurances are not enough.
        </p>
      </LegalSection>

      <LegalSection title="Move-in cost estimates">
        <p>
          Rent transparency figures on listing pages are estimates (agency fee,
          caution, agreement, etc.). Actual charges vary by landlord and state
          practice. Confirm every line item in writing before transfer.
        </p>
      </LegalSection>

      <LegalSection title="Third-party links and ads">
        <p>
          Listings, WhatsApp links, and sponsored ads may lead to external sites
          or businesses. We are not responsible for third-party content,
          products, or conduct. Sponsored placements are labelled
          &quot;Sponsored&quot;.
        </p>
      </LegalSection>

      <LegalSection title="No professional advice">
        <p>
          Nothing on {SITE_NAME} constitutes legal, financial, tax, or
          investment advice. Consult licensed professionals for your situation.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, {SITE_NAME} and its operators
          disclaim liability for direct, indirect, or consequential losses from
          use of the platform or transactions with other users, including fraud,
          property defects, eviction, or financial loss.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

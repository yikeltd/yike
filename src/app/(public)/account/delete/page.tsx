import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import {
  LegalCallout,
  LegalDocument,
  LegalSection,
} from "@/components/legal/legal-document";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: "Delete Account",
  description: `Request permanent deletion of your ${SITE_NAME} account and personal data.`,
  robots: { index: true, follow: true },
};

export default async function DeleteAccountPage() {
  const user = await getSession();

  return (
    <LegalDocument title="Delete your account" lastUpdated="5 June 2026">
      <LegalCallout>
        {SITE_NAME} supports in-app account deletion. Your request removes your
        profile, favourites, and listings from public view. Some records may be
        retained where required by law or for fraud prevention — see our{" "}
        <Link href="/privacy" className="font-semibold text-gold-dark underline">
          Privacy Policy
        </Link>
        .
      </LegalCallout>

      <LegalSection title="What gets deleted">
        <ul>
          <li>Your account and login credentials</li>
          <li>Profile information (name, phone, email, username)</li>
          <li>Saved homes and browsing preferences stored on your account</li>
          <li>Property listings you posted (removed from the marketplace)</li>
        </ul>
      </LegalSection>

      <LegalSection title="Delete in the app">
        {user ? (
          <div className="rounded-2xl border border-border bg-elevated p-5">
            <p className="mb-4 text-sm text-muted">
              Signed in as <strong className="text-foreground">{user.email}</strong>.
              Confirm below to delete immediately.
            </p>
            <DeleteAccountForm email={user.email ?? ""} />
          </div>
        ) : (
          <p>
            <Link
              href="/auth/login?next=/account/delete"
              className="font-semibold text-gold-dark underline"
            >
              Sign in
            </Link>{" "}
            to delete your account from this page, or go to{" "}
            <Link href="/agent" className="font-semibold text-gold-dark underline">
              Profile
            </Link>{" "}
            → Delete account when logged in on mobile.
          </p>
        )}
      </LegalSection>

      <LegalSection title="Need help?">
        <p>
          Email{" "}
          <a href="mailto:hello@yike.ng" className="font-semibold text-gold-dark underline">
            hello@yike.ng
          </a>{" "}
          from the address on your account if you cannot sign in. We respond within
          30 days per NDPA guidelines.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

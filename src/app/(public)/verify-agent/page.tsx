import Link from "next/link";
import { getSession, getProfile } from "@/lib/auth";

export default async function VerifyAgentPage() {
  const user = await getSession();
  const profile = user ? await getProfile(user.id) : null;

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-2xl font-bold">Get verified on Yike</h1>
      <p className="text-sm text-muted">
        Verified agents rank higher and earn more trust from renters and
        buyers. Manual review first — NIN API integration coming later.
      </p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
        <li>Valid phone and WhatsApp number</li>
        <li>Government ID upload</li>
        <li>Clear selfie for identity match</li>
        <li>Review within 1–2 business days</li>
      </ul>
      {user && profile?.role === "agent" ? (
        <Link
          href="/agent/verification"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white"
        >
          Start verification
        </Link>
      ) : (
        <Link
          href="/auth/signup?role=agent"
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white"
        >
          Create agent account
        </Link>
      )}
    </div>
  );
}

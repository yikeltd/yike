import type { Metadata } from "next";
import { getOrCreateOwnProfile, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveProfilePath } from "@/lib/account/account-home";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/** Legacy /profile alias — logged-in users go to agent hub; guests browse home. */
export default async function ProfileAliasPage() {
  const user = await getSession();
  if (user) {
    const profile = await getOrCreateOwnProfile(user);
    redirect(resolveProfilePath(profile));
  }
  redirect("/");
}

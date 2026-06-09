import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
};

/** Legacy /profile alias — logged-in users go to agent hub; guests browse home. */
export default async function ProfileAliasPage() {
  const user = await getSession();
  if (user) {
    redirect("/agent");
  }
  redirect("/");
}

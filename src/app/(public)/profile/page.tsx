import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Legacy /profile alias — logged-in users go to agent hub; guests browse home. */
export default async function ProfileAliasPage() {
  const user = await getSession();
  if (user) {
    redirect("/agent");
  }
  redirect("/");
}

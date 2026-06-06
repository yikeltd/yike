import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileAliasPage() {
  const user = await getSession();
  if (user) {
    redirect("/agent");
  }
  redirect("/auth/login?next=/agent");
}

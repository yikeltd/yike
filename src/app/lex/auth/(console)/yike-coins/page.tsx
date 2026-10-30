import { redirect } from "next/navigation";
import { getProfile, getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/admin/roles";
import { YikeCoinsGrantClient } from "./yike-coins-grant-client";

export const metadata = {
  title: "YC grants | Lex",
};

export default async function LexYikeCoinsPage() {
  const user = await getSession();
  if (!user) redirect("/lex/auth");

  const profile = await getProfile(user.id);
  if (!profile || !isSuperAdmin(profile.role)) {
    redirect("/lex/auth/overview");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Yike Coins (YC)</h1>
      <p className="mt-1 text-sm text-muted">Authorized grants and supply audit.</p>
      <div className="mt-6">
        <YikeCoinsGrantClient />
      </div>
    </div>
  );
}

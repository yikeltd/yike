"use client";

import Link from "next/link";
import { normalizeAccountStatus } from "@/lib/account-control";
import { StatusBadge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  account_status?: string | null;
  profile_status?: string | null;
  is_banned: boolean;
  created_at: string;
};

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-navy/5 bg-surface/80">
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Name</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Email</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Role</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Status</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Joined</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {users.map((u) => {
            const status = normalizeAccountStatus(u);
            return (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-navy">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.role} />
                </td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <StatusBadge status="suspended" />
                  ) : (
                    <StatusBadge status={status} />
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(u.created_at).toLocaleDateString("en-NG")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/lex/auth/users/${u.id}`}
                    className="text-xs font-bold text-gold-dark hover:underline"
                  >
                    Manage
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

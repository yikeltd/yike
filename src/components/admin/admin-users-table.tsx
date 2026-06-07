"use client";

import { AdminPinResetPanel } from "@/components/admin/admin-pin-reset-panel";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

export function AdminUsersTable({ users }: { users: UserRow[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-navy/5 bg-surface/80">
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Name</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Email</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Joined</th>
            <th className="px-4 py-3 text-xs font-bold uppercase text-muted">PIN</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-medium text-navy">{u.full_name ?? "—"}</td>
              <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-muted">
                {new Date(u.created_at).toLocaleDateString("en-NG")}
              </td>
              <td className="px-4 py-3">
                <AdminPinResetPanel
                  profileId={u.id}
                  pinType="login"
                  label="Reset login PIN"
                  compact
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

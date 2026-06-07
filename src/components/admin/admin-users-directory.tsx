"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { normalizeAccountStatus } from "@/lib/account-control";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminDirectoryRow, AdminUserFilter } from "@/lib/admin/users-directory";

const FILTER_OPTIONS: { value: AdminUserFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "users", label: "Users" },
  { value: "agents", label: "Agents" },
  { value: "companies", label: "Companies" },
  { value: "missing_profile", label: "Missing profile" },
  { value: "suspended", label: "Suspended" },
  { value: "on_hold", label: "On hold" },
  { value: "staff", label: "Staff" },
];

export function AdminUsersDirectory({
  initialRows,
  filter,
  query,
  total,
}: {
  initialRows: AdminDirectoryRow[];
  filter: AdminUserFilter;
  query: string;
  total: number;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState(query);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function applyFilter(next: AdminUserFilter) {
    const params = new URLSearchParams();
    if (next !== "all") params.set("filter", next);
    if (search.trim()) params.set("q", search.trim());
    router.push(`/lex/auth/users?${params.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (search.trim()) params.set("q", search.trim());
    router.push(`/lex/auth/users?${params.toString()}`);
  }

  async function repairProfile(row: AdminDirectoryRow) {
    setBusyId(row.id);
    setMessage("");
    const res = await fetch("/api/admin/users/repair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: row.id, email: row.email ?? undefined }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; created?: boolean };
    setBusyId(null);
    if (!res.ok) {
      setMessage(data.error ?? "Repair failed");
      return;
    }
    setMessage(data.created ? "Profile created." : "Profile repaired.");
    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, profile_missing: false, role: r.role === "—" ? "user" : r.role } : r
      )
    );
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-elevated p-1">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => applyFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                filter === f.value
                  ? "bg-navy text-white"
                  : "text-muted hover:bg-white hover:text-navy"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={submitSearch} className="flex min-w-[200px] flex-1 gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="h-10"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      {message && <p className="text-sm text-navy">{message}</p>}
      <p className="text-xs text-muted">{total} result(s)</p>

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy/5 bg-surface/80">
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Name</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Email</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Type</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Status</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted">Joined</th>
              <th className="px-4 py-3 text-xs font-bold uppercase text-muted" />
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((u) => {
              const status = normalizeAccountStatus(u);
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-navy">
                    {u.full_name ?? u.company_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      <StatusBadge status={u.role === "—" ? "user" : u.role} />
                      {u.profile_missing && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Profile missing
                        </span>
                      )}
                    </div>
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
                    <div className="flex justify-end gap-2">
                      {u.profile_missing ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() => void repairProfile(u)}
                        >
                          Repair
                        </Button>
                      ) : (
                        <Link
                          href={`/lex/auth/users/${u.id}`}
                          className="text-xs font-bold text-gold-dark hover:underline"
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No accounts match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

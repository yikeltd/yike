"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  action_label: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

export function UserNotificationsClient() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications?limit=40");
    const data = (await res.json()) as {
      notifications?: NotificationRow[];
      unreadCount?: number;
    };
    setRows(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, read_at: new Date().toISOString() } : r
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setRows((prev) =>
      prev.map((r) => ({ ...r, read_at: r.read_at ?? new Date().toISOString() }))
    );
    setUnreadCount(0);
  }

  return (
    <div className="space-y-4 pb-8 pt-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gold-dark" />
          <h1 className="text-xl font-bold text-navy">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-dark">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => void markAllRead()}>
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-elevated px-5 py-10 text-center">
          <p className="font-medium text-navy">You&apos;re all caught up</p>
          <p className="mt-1 text-sm text-muted">New updates from Yike will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => (
            <li
              key={n.id}
              className={cn(
                "rounded-2xl border px-4 py-3",
                n.read_at ? "border-border bg-elevated" : "border-gold/25 bg-gold/5"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-navy">{n.title}</p>
                  <p className="mt-1 text-sm text-muted">{n.body}</p>
                  <time className="mt-2 block text-[10px] text-muted">
                    {new Date(n.created_at).toLocaleString("en-NG")}
                  </time>
                </div>
                {!n.read_at && (
                  <button
                    type="button"
                    onClick={() => void markRead(n.id)}
                    className="shrink-0 text-[10px] font-bold text-gold-dark"
                  >
                    Mark read
                  </button>
                )}
              </div>
              {n.action_label && n.action_url ? (
                <Link
                  href={n.action_url}
                  onClick={() => {
                    if (!n.read_at) void markRead(n.id);
                  }}
                  className="mt-3 inline-flex rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white"
                >
                  {n.action_label}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

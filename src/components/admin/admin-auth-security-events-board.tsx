"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type SecurityEvent = {
  id: string;
  user_id: string | null;
  event_type: string;
  metadata: Record<string, unknown> | null;
  ip_hash: string | null;
  created_at: string;
  profiles?: {
    email?: string | null;
    username?: string | null;
    full_name?: string | null;
  } | null;
};

const EVENT_TYPES = [
  "",
  "login.success",
  "login.failed",
  "pin.success",
  "pin.failed",
  "pin.locked",
  "device.trusted",
  "device.new",
  "session.timeout",
  "session.unlock",
  "sensitive.confirmed",
  "sensitive.failed",
  "bank_change.confirmed",
  "email_change.confirmed",
  "password_change.confirmed",
] as const;

function formatEventLabel(type: string): string {
  return type.replace(/\./g, " · ");
}

function isSuspicious(type: string): boolean {
  return (
    type === "login.failed" ||
    type === "pin.failed" ||
    type === "pin.locked" ||
    type === "sensitive.failed" ||
    type === "device.new"
  );
}

export function AdminAuthSecurityEventsBoard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventType, setEventType] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "100" });
    if (eventType) params.set("type", eventType);
    if (userQuery.trim()) params.set("user", userQuery.trim());
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(`${to}T23:59:59`).toISOString());
    if (suspiciousOnly) params.set("suspicious", "1");

    const res = await fetch(`/api/admin/auth-security/events?${params}`);
    const json = (await res.json().catch(() => ({}))) as {
      events?: SecurityEvent[];
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Could not load events");
      return;
    }
    setEvents(json.events ?? []);
  }, [eventType, from, suspiciousOnly, to, userQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted">Event type</label>
          <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {EVENT_TYPES.map((t) => (
              <option key={t || "all"} value={t}>
                {t ? formatEventLabel(t) : "All events"}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted">User ID</label>
          <Input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="UUID"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-muted">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => setSuspiciousOnly(e.target.checked)}
              className="rounded border-navy/20"
            />
            Suspicious only
          </label>
          <Button type="button" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Apply filters"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  {loading ? "Loading events…" : "No events match these filters."}
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const profile = event.profiles;
                const userLabel =
                  profile?.full_name ||
                  profile?.username ||
                  profile?.email ||
                  event.user_id?.slice(0, 8) ||
                  "—";
                return (
                  <tr key={event.id} className="border-b border-navy/5 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(event.created_at).toLocaleString("en-NG")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isSuspicious(event.event_type)
                            ? "font-semibold text-amber-800"
                            : "font-medium text-navy"
                        }
                      >
                        {formatEventLabel(event.event_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy">
                      <div>{userLabel}</div>
                      {profile?.email ? (
                        <div className="text-xs text-muted">{profile.email}</div>
                      ) : null}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted">
                      {event.metadata && Object.keys(event.metadata).length > 0
                        ? JSON.stringify(event.metadata)
                        : event.ip_hash
                          ? `IP hash ${event.ip_hash.slice(0, 8)}…`
                          : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

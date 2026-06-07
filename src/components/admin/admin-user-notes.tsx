"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePinGate } from "@/components/admin/pin-confirm-modal";

type NoteRow = {
  id: string;
  body: string;
  created_at: string;
  author?: { full_name: string | null } | null;
};

export function AdminUserNotes({ profileId }: { profileId: string }) {
  const { requirePin, pinModal } = usePinGate();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadNotes() {
    setLoading(true);
    const res = await fetch(`/api/admin/profiles/${profileId}/notes`);
    const data = (await res.json()) as { notes?: NoteRow[]; error?: string };
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not load notes");
      return;
    }
    setNotes(data.notes ?? []);
  }

  useEffect(() => {
    void loadNotes();
  }, [profileId]);

  async function saveNote() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/profiles/${profileId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: draft }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save note");
      return;
    }
    setDraft("");
    await loadNotes();
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white p-5 shadow-sm space-y-4">
      {pinModal}
      <h2 className="font-bold text-navy">Admin notes</h2>
      <p className="text-xs text-muted">Internal only — never shown to users.</p>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-surface/80 px-3 py-2 text-sm">
              <p className="text-navy">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted">
                {n.author?.full_name ?? "Staff"} ·{" "}
                {new Date(n.created_at).toLocaleString("en-NG")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="e.g. Verified on WhatsApp call, duplicate listings flagged…"
        className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        size="sm"
        disabled={busy || !draft.trim()}
        onClick={() => requirePin(() => void saveNote())}
      >
        Add note (PIN required)
      </Button>
    </section>
  );
}

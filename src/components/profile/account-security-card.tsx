"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpCodeInput } from "@/components/auth/otp-code-input";

export function AccountSecurityCard({
  email,
}: {
  email: string;
}) {
  const router = useRouter();
  const { gateSensitiveAction, sensitiveActionModals } = useSensitiveActionGate(email);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const gate = await gateSensitiveAction("change_password");
    if (!gate.ok) return;

    setBusy(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newPassword,
        sensitiveConfirmationToken: gate.confirmationToken,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not update password.");
      return;
    }

    setMessage(data.message ?? "Password updated.");
    setNewPassword("");
    setPasswordOpen(false);
    router.refresh();
  }

  async function sendNewEmailCode() {
    setError("");
    setMessage("");
    setBusy(true);
    const res = await fetch("/api/account/change-email/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send code.");
      return;
    }
    setEmailCodeSent(true);
    setMessage(data.message ?? "Code sent to your new email.");
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const gate = await gateSensitiveAction("change_email");
    if (!gate.ok) return;

    setBusy(true);
    const res = await fetch("/api/account/change-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newEmail,
        code: emailCode,
        sensitiveConfirmationToken: gate.confirmationToken,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not update email.");
      return;
    }

    setMessage(data.message ?? "Email updated.");
    setEmailOpen(false);
    setEmailCodeSent(false);
    setNewEmail("");
    setEmailCode("");
    router.refresh();
  }

  return (
    <>
      {sensitiveActionModals}
      <section className="rounded-2xl border border-border bg-elevated p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Security</p>
        <p className="mt-1 text-sm text-muted">
          Sensitive changes require your PIN or password, and email confirmation where needed.
        </p>

        {message ? (
          <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-sm text-navy">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div className="mt-4 space-y-3">
          {!passwordOpen ? (
            <Button type="button" variant="secondary" fullWidth onClick={() => setPasswordOpen(true)}>
              Change password
            </Button>
          ) : (
            <form onSubmit={changePassword} className="space-y-3 rounded-xl border border-navy/10 p-3">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (8+ characters)"
                minLength={8}
                required
                className="h-11 rounded-xl"
                autoComplete="new-password"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy}>
                  {busy ? "Saving…" : "Save password"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPasswordOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {!emailOpen ? (
            <Button type="button" variant="secondary" fullWidth onClick={() => setEmailOpen(true)}>
              Change email
            </Button>
          ) : (
            <form onSubmit={changeEmail} className="space-y-3 rounded-xl border border-navy/10 p-3">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                required
                className="h-11 rounded-xl"
                autoComplete="email"
              />
              {!emailCodeSent ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !newEmail.includes("@")}
                  onClick={() => void sendNewEmailCode()}
                >
                  Send code to new email
                </Button>
              ) : (
                <>
                  <OtpCodeInput value={emailCode} onChange={setEmailCode} disabled={busy} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={busy || emailCode.length !== 6}>
                      {busy ? "Saving…" : "Confirm new email"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEmailOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </section>
    </>
  );
}

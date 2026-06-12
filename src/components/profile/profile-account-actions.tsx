"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Mail, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { cn } from "@/lib/utils";

export function ProfileAccountActions({
  email,
  canList = false,
}: {
  email: string;
  canList?: boolean;
}) {
  const router = useRouter();
  const { signOut } = useAuth();
  const { gateSensitiveAction, sensitiveActionModals } = useSensitiveActionGate(email);
  const [loggingOut, setLoggingOut] = useState(false);
  const [panel, setPanel] = useState<"password" | "email" | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editProfileHref = canList ? "/agent/profile-setup" : "/agent";

  function resetForms() {
    setPanel(null);
    setNewPassword("");
    setNewEmail("");
    setEmailCode("");
    setEmailCodeSent(false);
    setError("");
    setMessage("");
  }

  async function handleSignOut() {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut("/");
  }

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
    resetForms();
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
    setMessage(data.message ?? "Code sent.");
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
    resetForms();
    router.refresh();
  }

  return (
    <>
      {sensitiveActionModals}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-navy/70">
          Account
        </h2>

        {message ? (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm font-medium text-navy">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div className="space-y-1">
          <AccountRow
            icon={UserRound}
            label="Edit profile"
            href={editProfileHref}
          />
          <AccountRow
            icon={KeyRound}
            label="Change password"
            onClick={() => {
              setPanel(panel === "password" ? null : "password");
              setError("");
            }}
            active={panel === "password"}
          />
          <AccountRow
            icon={Mail}
            label="Change email"
            onClick={() => {
              setPanel(panel === "email" ? null : "email");
              setError("");
            }}
            active={panel === "email"}
          />
          <AccountRow
            icon={LogOut}
            label={loggingOut ? "Logging out…" : "Log out"}
            onClick={() => void handleSignOut()}
            disabled={loggingOut}
          />
        </div>

        {panel === "password" ? (
          <form onSubmit={changePassword} className="space-y-3 rounded-2xl border border-navy/10 bg-elevated p-3">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              minLength={8}
              required
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={resetForms}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {panel === "email" ? (
          <form onSubmit={changeEmail} className="space-y-3 rounded-2xl border border-navy/10 bg-elevated p-3">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email"
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
                Send code
              </Button>
            ) : (
              <>
                <OtpCodeInput value={emailCode} onChange={setEmailCode} disabled={busy} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={busy || emailCode.length !== 6}>
                    {busy ? "Saving…" : "Confirm"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={resetForms}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        ) : null}

        <p className="truncate px-0.5 text-xs text-muted">{email}</p>
      </section>

      <section className="mt-4 border-t border-danger/15 pt-4">
        <h2 className="px-0.5 text-[11px] font-bold uppercase tracking-wider text-danger/80">
          Danger zone
        </h2>
        <Link
          href="/account/delete"
          className="pressable mt-2 flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/5 px-3.5 py-3 text-sm font-semibold text-danger"
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          Delete account
        </Link>
      </section>
    </>
  );
}

function AccountRow({
  icon: Icon,
  label,
  href,
  onClick,
  active,
  disabled,
}: {
  icon: typeof KeyRound;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  const className = cn(
    "yike-card yike-card-interactive pressable flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
    active
      ? "yike-selected bg-navy/[0.03]"
      : "hover:border-navy/15"
  );

  const inner = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 text-navy" />
      <span className="text-xs font-semibold text-navy">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  );
}

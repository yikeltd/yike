"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Mail, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { cn } from "@/lib/utils";

export function ProfileAccountActions({ email }: { email: string }) {
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
      <section className="space-y-3">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Account</p>

        {message ? (
          <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm font-medium text-navy">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-2.5">
          <AccountTile
            icon={KeyRound}
            label="Change password"
            onClick={() => {
              setPanel(panel === "password" ? null : "password");
              setError("");
            }}
            active={panel === "password"}
            variant="navy"
          />
          <AccountTile
            icon={Mail}
            label="Change email"
            onClick={() => {
              setPanel(panel === "email" ? null : "email");
              setError("");
            }}
            active={panel === "email"}
            variant="navy"
          />
          <AccountTile
            icon={LogOut}
            label={loggingOut ? "Logging out…" : "Log out"}
            onClick={() => void handleSignOut()}
            variant="outline"
            disabled={loggingOut}
          />
          <Link
            href="/account/delete"
            className={cn(
              "pressable flex flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center",
              "border-danger/25 bg-danger/5 text-danger"
            )}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-xs font-bold leading-tight">Delete account</span>
          </Link>
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

        <p className="truncate px-1 text-xs text-muted">{email}</p>
      </section>
    </>
  );
}

function AccountTile({
  icon: Icon,
  label,
  onClick,
  active,
  variant,
  disabled,
}: {
  icon: typeof KeyRound;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant: "navy" | "outline";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "pressable flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 text-center transition-colors",
        variant === "navy" &&
          (active
            ? "bg-gold text-navy shadow-glow-gold"
            : "bg-navy text-white shadow-float"),
        variant === "outline" && "border border-navy/12 bg-elevated text-navy"
      )}
    >
      <Icon className={cn("h-5 w-5", variant === "navy" && !active && "text-gold")} />
      <span className="text-xs font-bold leading-tight">{label}</span>
    </button>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  KeyRound,
  LogOut,
  Mail,
  MessageCircle,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useSensitiveActionGate } from "@/components/auth/use-sensitive-action-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { openYikeSupportWhatsApp } from "@/lib/support";
import { useStandaloneApp } from "@/hooks/use-standalone-app";
import { cn } from "@/lib/utils";

export function ProfileAccountActions({
  email,
}: {
  email: string;
  /** @deprecated Edit Profile is available to all signed-in users */
  canList?: boolean;
}) {
  const router = useRouter();
  const { isApp } = useStandaloneApp();
  const { signOut } = useAuth();
  const { gateSensitiveAction, sensitiveActionModals } = useSensitiveActionGate(email);
  const [loggingOut, setLoggingOut] = useState(false);
  const [panel, setPanel] = useState<"password" | "email" | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editProfileHref = "/agent/edit-profile";

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

      <section className="dashboard-fade-in space-y-3">
        <h2 className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/45">
          Account
        </h2>

        {message ? (
          <p className="rounded-xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-medium text-navy">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200/70 bg-red-50 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        <div className="space-y-2.5">
          <SettingsCard
            title="Profile"
            tone="gold"
            icon={<UserRound className="h-3.5 w-3.5" strokeWidth={2.25} />}
          >
            <SettingsRow
              href={editProfileHref}
              label="Edit Profile"
              subtitle="Name, photo & public details"
              icon={<UserRound className="h-4 w-4" strokeWidth={2} />}
              tone="gold"
            />
          </SettingsCard>

          <SettingsCard
            title="Security"
            tone="blue"
            icon={<KeyRound className="h-3.5 w-3.5" strokeWidth={2.25} />}
          >
            <SettingsRow
              label="Change Password"
              subtitle="Update your login password"
              icon={<KeyRound className="h-4 w-4" strokeWidth={2} />}
              tone="blue"
              active={panel === "password"}
              onClick={() => {
                setPanel(panel === "password" ? null : "password");
                setError("");
              }}
            />
            {panel === "password" ? (
              <form
                onSubmit={changePassword}
                className="space-y-2.5 border-t border-sky-500/10 bg-sky-500/[0.04] px-3.5 py-3"
              >
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  minLength={8}
                  required
                  className="h-10 rounded-lg"
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

            <SettingsRow
              label="Change Email"
              subtitle="We’ll verify the new address"
              icon={<Mail className="h-4 w-4" strokeWidth={2} />}
              tone="blue"
              active={panel === "email"}
              onClick={() => {
                setPanel(panel === "email" ? null : "email");
                setError("");
              }}
            />
            {panel === "email" ? (
              <form
                onSubmit={changeEmail}
                className="space-y-2.5 border-t border-sky-500/10 bg-sky-500/[0.04] px-3.5 py-3"
              >
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email"
                  required
                  className="h-10 rounded-lg"
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

            <div className="border-t border-sky-500/10">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="pressable flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-sky-500/[0.04]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/[0.05] text-navy/55">
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      advancedOpen && "rotate-180"
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-medium text-navy/60">
                  Advanced
                </span>
              </button>
              {advancedOpen ? (
                <div className="px-3.5 pb-3 pl-[3.75rem]">
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="text-[11px] font-medium text-danger/75 transition-colors hover:text-danger"
                  >
                    Delete Account
                  </button>
                </div>
              ) : null}
            </div>
          </SettingsCard>

          <SettingsCard
            title="Support"
            tone="emerald"
            icon={<CircleHelp className="h-3.5 w-3.5" strokeWidth={2.25} />}
          >
            <SettingsRow
              href="/safety"
              label="Help Center"
              subtitle="Safety tips & guides"
              icon={<CircleHelp className="h-4 w-4" strokeWidth={2} />}
              tone="emerald"
            />
            <SettingsRow
              label="Contact Support"
              subtitle="Chat with us on WhatsApp"
              icon={<MessageCircle className="h-4 w-4" strokeWidth={2} />}
              tone="emerald"
              onClick={() => openYikeSupportWhatsApp(undefined, { preferSameTab: isApp })}
            />
          </SettingsCard>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <p className="truncate text-[11px] text-muted">{email}</p>
        </div>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={loggingOut}
          className="pressable flex w-full items-center justify-center gap-2 rounded-xl border border-navy/10 bg-gradient-to-b from-white to-navy/[0.03] px-3 py-2.5 text-[13px] font-semibold text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-float active:scale-[0.99]"
        >
          <LogOut className="h-3.5 w-3.5 text-navy/70" />
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </section>

      {deleteOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-5 shadow-hero">
            <h3 id="delete-account-title" className="text-lg font-bold text-navy">
              Delete account?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This opens the account deletion flow. Your listings and saved homes may be
              removed.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                onClick={() => {
                  setDeleteOpen(false);
                  router.push("/account/delete");
                }}
              >
                <Trash2 className="h-4 w-4" />
                Continue
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type SettingsTone = "gold" | "blue" | "emerald";

const toneMap: Record<
  SettingsTone,
  {
    card: string;
    header: string;
    iconWrap: string;
    iconFg: string;
    rowIcon: string;
    rowHover: string;
    rowActive: string;
  }
> = {
  gold: {
    card: "border-gold/20 bg-gradient-to-b from-gold/[0.07] to-white",
    header: "text-gold-dark/80",
    iconWrap: "bg-gold/20 text-gold-dark",
    iconFg: "text-gold-dark",
    rowIcon: "bg-gold/15 text-navy",
    rowHover: "hover:bg-gold/[0.08]",
    rowActive: "bg-gold/15",
  },
  blue: {
    card: "border-sky-500/15 bg-gradient-to-b from-sky-500/[0.06] to-white",
    header: "text-sky-800/70",
    iconWrap: "bg-sky-500/15 text-sky-700",
    iconFg: "text-sky-700",
    rowIcon: "bg-sky-500/12 text-sky-800",
    rowHover: "hover:bg-sky-500/[0.06]",
    rowActive: "bg-sky-500/10",
  },
  emerald: {
    card: "border-emerald-500/15 bg-gradient-to-b from-emerald-500/[0.06] to-white",
    header: "text-emerald-800/70",
    iconWrap: "bg-emerald-500/15 text-emerald-700",
    iconFg: "text-emerald-700",
    rowIcon: "bg-emerald-500/12 text-emerald-800",
    rowHover: "hover:bg-emerald-500/[0.06]",
    rowActive: "bg-emerald-500/10",
  },
};

function SettingsCard({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: ReactNode;
  tone: SettingsTone;
  children: ReactNode;
}) {
  const t = toneMap[tone];
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm",
        t.card
      )}
    >
      <div className={cn("flex items-center gap-2 px-3.5 pb-1 pt-3", t.header)}>
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            t.iconWrap
          )}
        >
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{title}</span>
      </div>
      <div className="pb-1">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  href,
  onClick,
  active,
  subtitle,
  icon,
  tone = "gold",
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  subtitle?: string;
  icon?: ReactNode;
  tone?: SettingsTone;
}) {
  const t = toneMap[tone];
  const className = cn(
    "pressable group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
    active ? t.rowActive : t.rowHover
  );

  const body = (trailing: ReactNode) => (
    <>
      {icon ? (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105",
            t.rowIcon
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-navy">{label}</span>
        {subtitle ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted">{subtitle}</span>
        ) : null}
      </span>
      {trailing}
    </>
  );

  const chevron = (
    <ChevronRight
      className="h-3.5 w-3.5 shrink-0 text-muted/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-navy/40"
      aria-hidden
    />
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {body(
          active ? (
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 text-navy/45"
              aria-hidden
            />
          ) : (
            chevron
          )
        )}
      </button>
    );
  }

  if (!href) {
    return (
      <div
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left opacity-55"
        aria-disabled="true"
      >
        {body(
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Soon
          </span>
        )}
      </div>
    );
  }

  return (
    <Link href={href} prefetch className={className}>
      {body(chevron)}
    </Link>
  );
}

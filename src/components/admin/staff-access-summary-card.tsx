"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PinConfirmModal } from "@/components/admin/pin-confirm-modal";
import { AdminPasswordField } from "@/components/admin/admin-password-field";
import { StatusBadge } from "@/components/admin/dashboard/admin-ui";
import { STAFF_LIFECYCLE_LABELS } from "@/lib/admin/staff-onboarding/status";
import type { StaffLifecycleStatus } from "@/lib/admin/staff-onboarding/status";
import type { StaffOnboardingEvent, StaffProfile, StaffRole } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  staff: StaffProfile;
  onboardedByName?: string | null;
  events?: (StaffOnboardingEvent & { actor_name?: string | null })[];
  compact?: boolean;
  onUpdated?: () => void;
};

const ROLES: StaffRole[] = [
  "super_admin",
  "admin",
  "support",
  "tech",
  "content",
  "careers",
  "moderator",
];

export function StaffAccessSummaryCard({
  staff,
  onboardedByName,
  events = [],
  compact,
  onUpdated,
}: Props) {
  const router = useRouter();
  const [showPin, setShowPin] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [showRoleEdit, setShowRoleEdit] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendPasswords, setResendPasswords] = useState({
    zoho_temp_password: "",
    yike_temp_password: "",
  });
  const [newRole, setNewRole] = useState(staff.role);
  const [internalNotes, setInternalNotes] = useState(staff.internal_notes ?? "");
  const [resetPassword, setResetPassword] = useState("");
  const [loadedEvents, setLoadedEvents] = useState(events);

  useEffect(() => {
    if (events.length > 0) {
      setLoadedEvents(events);
      return;
    }
    void fetch(`/api/admin/staff/${staff.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.events) setLoadedEvents(d.events);
      });
  }, [staff.id, events]);

  const statusLabel =
    STAFF_LIFECYCLE_LABELS[staff.status as StaffLifecycleStatus] ?? staff.status;

  const resendEvents = loadedEvents.filter((e) =>
    ["onboarding_sent", "onboarding_resent"].includes(e.event_type)
  );

  const runAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/staff/${staff.id}`, {
          method: action === "resend_onboarding" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "resend_onboarding"
              ? { action, ...resendPasswords }
              : { action, ...extra }
          ),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Action failed");
          return;
        }
        setShowResend(false);
        setShowRoleEdit(false);
        setShowNotes(false);
        setResetPassword("");
        onUpdated?.();
        router.refresh();
      } catch {
        setError("Action failed");
      } finally {
        setBusy(false);
        setShowPin(false);
        setPendingAction(null);
      }
    },
    [staff.id, resendPasswords, onUpdated, router]
  );

  return (
    <div
      className={cn(
        "rounded-2xl border border-navy/10 bg-white shadow-sm",
        compact ? "p-4" : "p-5"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gold-dark">
            Yike Crew Access
          </p>
          <p className="mt-1 font-bold text-navy">{staff.full_name}</p>
        </div>
        <StatusBadge status={staff.status} />
      </div>

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Role</dt>
          <dd className="font-medium text-navy">
            {staff.onboarding_role_label ?? staff.role.replace("_", " ")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Workspace</dt>
          <dd className="font-medium text-navy">{staff.department ?? "General"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Work email</dt>
          <dd className="font-medium text-navy">{staff.work_email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Status</dt>
          <dd className="font-medium text-navy">{statusLabel}</dd>
        </div>
      </dl>

      {!compact && (
        <StaffOnboardingHistoryInline
          staff={staff}
          onboardedByName={onboardedByName}
          resendEvents={resendEvents}
        />
      )}

      {staff.internal_notes && compact && (
        <p className="mt-3 rounded-lg bg-surface/80 px-3 py-2 text-xs text-muted">
          Admin note on file
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionBtn
          label="Resend onboarding"
          onClick={() => setShowResend(true)}
          disabled={staff.status === "archived"}
        />
        <ActionBtn
          label="Reset password"
          onClick={() => {
            setResetPassword("");
            setPendingAction("reset_password");
            setShowResend(false);
            setShowRoleEdit(false);
            setShowNotes(false);
          }}
        />
        {staff.status === "active" || staff.status === "first_login_pending" ? (
          <ActionBtn
            label="Suspend access"
            variant="danger"
            onClick={() => {
              setPendingAction("suspend");
              setShowPin(true);
            }}
          />
        ) : staff.status === "suspended" ? (
          <ActionBtn
            label="Reactivate"
            onClick={() => {
              setPendingAction("reactivate");
              setShowPin(true);
            }}
          />
        ) : null}
        <ActionBtn label="Edit role" onClick={() => setShowRoleEdit(true)} />
        {!compact && (
          <ActionBtn label="Internal notes" onClick={() => setShowNotes(true)} />
        )}
        {staff.status !== "archived" && (
          <ActionBtn
            label="Archive"
            variant="muted"
            onClick={() => {
              setPendingAction("archive");
              setShowPin(true);
            }}
          />
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {showResend && (
        <ModalShell title="Resend onboarding email" onClose={() => setShowResend(false)}>
          <p className="text-xs text-muted">
            Re-enter temporary passwords — they are emailed once and never stored.
          </p>
          <AdminPasswordField
            label="Zoho temporary password"
            value={resendPasswords.zoho_temp_password}
            onChange={(v) =>
              setResendPasswords((p) => ({ ...p, zoho_temp_password: v }))
            }
          />
          <AdminPasswordField
            label="Yike staff login password"
            value={resendPasswords.yike_temp_password}
            onChange={(v) =>
              setResendPasswords((p) => ({ ...p, yike_temp_password: v }))
            }
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPendingAction("resend_onboarding");
              setShowPin(true);
            }}
            className="mt-3 w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
          >
            Send resend email
          </button>
        </ModalShell>
      )}

      {showRoleEdit && (
        <ModalShell title="Edit staff role" onClose={() => setShowRoleEdit(false)}>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as StaffRole)}
            className="w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || newRole === staff.role}
            onClick={() => {
              setPendingAction("change_role");
              setShowPin(true);
            }}
            className="mt-3 w-full rounded-xl bg-navy py-2.5 text-sm font-bold text-gold disabled:opacity-60"
          >
            Save role change
          </button>
        </ModalShell>
      )}

      {showNotes && (
        <ModalShell title="Internal admin notes" onClose={() => setShowNotes(false)}>
          <p className="text-xs text-muted">Private — never visible to staff.</p>
          <textarea
            rows={4}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="mt-2 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
            placeholder="Part-time only, needs supervision, strong SEO portfolio…"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPendingAction("update_internal_notes");
              setShowPin(true);
            }}
            className="mt-3 w-full rounded-xl bg-navy py-2.5 text-sm font-bold text-gold disabled:opacity-60"
          >
            Save notes
          </button>
        </ModalShell>
      )}

      {pendingAction === "reset_password" && (
        <ModalShell title="Set new temporary password" onClose={() => setPendingAction(null)}>
          <AdminPasswordField
            label="New Yike login password"
            value={resetPassword}
            onChange={setResetPassword}
          />
          <button
            type="button"
            disabled={busy || resetPassword.length < 8}
            onClick={() => setShowPin(true)}
            className="mt-3 w-full rounded-xl bg-gold py-2.5 text-sm font-bold text-navy disabled:opacity-60"
          >
            Continue with PIN
          </button>
        </ModalShell>
      )}

      {showPin && pendingAction && (
        <PinConfirmModal
          onVerified={() => {
            if (pendingAction === "change_role") {
              void runAction("change_role", { role: newRole });
            } else if (pendingAction === "update_internal_notes") {
              void runAction("update_internal_notes", { internal_notes: internalNotes });
            } else if (pendingAction === "resend_onboarding") {
              void runAction("resend_onboarding");
            } else if (pendingAction === "reset_password") {
              void runAction("reset_password", { password: resetPassword });
            } else {
              void runAction(pendingAction);
            }
          }}
          onCancel={() => {
            setShowPin(false);
            if (pendingAction === "reset_password") setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}

function StaffOnboardingHistoryInline({
  staff,
  onboardedByName,
  resendEvents,
}: {
  staff: StaffProfile;
  onboardedByName?: string | null;
  resendEvents: (StaffOnboardingEvent & { actor_name?: string | null })[];
}) {
  return (
    <div className="mt-4 rounded-xl bg-surface/60 p-3 text-xs text-muted">
      <p className="font-semibold text-navy">Onboarding history</p>
      <ul className="mt-2 space-y-1">
        {staff.onboarding_sent_at && (
          <li>
            Sent {new Date(staff.onboarding_sent_at).toLocaleString("en-NG")}
            {onboardedByName ? ` · by ${onboardedByName}` : ""}
          </li>
        )}
        {staff.first_login_at && (
          <li>First login {new Date(staff.first_login_at).toLocaleString("en-NG")}</li>
        )}
        {staff.password_reset_completed_at && (
          <li>
            Password reset completed{" "}
            {new Date(staff.password_reset_completed_at).toLocaleString("en-NG")}
          </li>
        )}
        {resendEvents.map((e) => (
          <li key={e.id}>
            Resent {new Date(e.created_at).toLocaleString("en-NG")}
            {e.actor_name ? ` · by ${e.actor_name}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "muted";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 disabled:opacity-50",
        variant === "danger" && "text-red-700 ring-red-200 hover:bg-red-50",
        variant === "muted" && "text-muted ring-navy/10 hover:bg-surface",
        variant === "default" && "text-navy ring-navy/10 hover:bg-surface"
      )}
    >
      {label}
    </button>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 p-4">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StaffOnboardingHistoryPanel({
  staffId,
}: {
  staffId: string;
}) {
  const [data, setData] = useState<{
    staff: StaffProfile;
    onboarded_by_name: string | null;
    events: StaffOnboardingEvent[];
  } | null>(null);

  useEffect(() => {
    void fetch(`/api/admin/staff/${staffId}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [staffId]);

  if (!data?.staff) return null;

  return (
    <StaffAccessSummaryCard
      staff={data.staff}
      onboardedByName={data.onboarded_by_name}
      events={data.events}
    />
  );
}

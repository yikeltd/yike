"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { generateTemporaryPassword } from "@/lib/admin/staff-onboarding/password";

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onGenerated?: () => void;
  required?: boolean;
  id?: string;
};

export function AdminPasswordField({
  label,
  hint,
  value,
  onChange,
  onGenerated,
  required,
  id,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  function generate() {
    onChange(generateTemporaryPassword());
    onGenerated?.();
  }

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <label className="block text-xs font-semibold text-muted" htmlFor={id}>
      {label}
      {required && <span className="text-gold-dark"> *</span>}
      {hint && <span className="mt-0.5 block font-normal text-[11px]">{hint}</span>}
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete="new-password"
          className="min-w-0 flex-1 rounded-xl border border-navy/10 px-3 py-2 text-sm font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="pressable shrink-0 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-navy"
        >
          {visible ? "Hide" : "Show"}
        </button>
        <button
          type="button"
          onClick={generate}
          className="pressable shrink-0 rounded-xl bg-gold/20 px-3 py-2 text-xs font-bold text-navy"
        >
          Generate
        </button>
        <button
          type="button"
          disabled={!value}
          onClick={() => void copy()}
          className="pressable shrink-0 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-muted disabled:opacity-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </label>
  );
}

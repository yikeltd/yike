"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  JOB_TYPES,
  ROLE_CATEGORIES,
} from "@/lib/careers/constants";

export function CareerJobForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("Remote / Nigeria");
  const [category, setCategory] = useState("marketing");
  const [jobType, setJobType] = useState("full_time");
  const [shortDescription, setShortDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  async function create(publish: boolean) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/careers/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        department,
        location,
        category,
        jobType,
        shortDescription,
        responsibilities,
        requirements,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        publish,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setTitle("");
    setShortDescription("");
    setResponsibilities("");
    setRequirements("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-float">
      <h2 className="text-lg font-bold text-navy">Publish a role</h2>
      <p className="mt-1 text-sm text-muted">
        Enter basics — we&apos;ll auto-generate questions, skills, and scoring.
      </p>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Job title *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
            placeholder="Growth marketer"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Department *</span>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
            placeholder="Marketing"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Location *</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
          >
            {ROLE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Job type</span>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
          >
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Salary min (₦, optional)</span>
          <input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-navy">Salary max (₦, optional)</span>
          <input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">Role summary *</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            One or two sentences for the hero — the pitch, not the full task list.
          </span>
          <textarea
            rows={2}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
            placeholder="Join Yike as a Field Verification Agent and help eliminate housing fraud."
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">What they&apos;ll do</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            One responsibility per line — shown as bullets on the job page.
          </span>
          <textarea
            rows={4}
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
            placeholder={"Visit listed properties and confirm they exist\nVerify landlord or agent identity on site\nInspect condition vs listing photos\nSubmit verification report within 24 hours"}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold text-navy">What we&apos;re looking for *</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            Candidate requirements — one point per line.
          </span>
          <textarea
            rows={4}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/10 px-3 py-2 text-sm"
            placeholder="Based in Aba, Enugu, or Owerri&#10;Smartphone with mobile data&#10;Comfortable visiting properties daily"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void create(true)}
          className="pressable rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
        >
          {busy ? "Saving…" : "Publish live"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void create(false)}
          className="pressable rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy"
        >
          Save draft
        </button>
      </div>
    </div>
  );
}

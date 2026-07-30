"use client";

import type { QuestionFieldConfig, QuestionOption } from "@/lib/listing-engine/types";
import { OnboardingCardGrid } from "@/components/onboarding/onboarding-card-grid";
import { MediaEngine } from "./media-engine";
import { cn } from "@/lib/utils";

type Props = {
  field: QuestionFieldConfig;
  value: unknown;
  error?: string | null;
  onChange: (value: unknown) => void;
};

export function QuestionRenderer({ field, value, error, onChange }: Props) {
  if (field.type === "card_select" && field.options) {
    const gridItems = field.options.map((opt) => ({
      id: opt.id,
      title: opt.label,
      subtitle: opt.subtitle,
      assetCategory: opt.assetCategory ?? "cars",
      assetName: opt.assetName ?? "car",
      badge: opt.badge,
    }));

    return (
      <div className="space-y-2">
        <label className="block text-xs md:text-sm font-bold uppercase text-[#031B4E] tracking-wide">
          {field.label}
        </label>
        <OnboardingCardGrid
          items={gridItems}
          selectedId={(value as string) ?? null}
          onSelect={(id) => onChange(id)}
        />
        {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
      </div>
    );
  }

  if (field.type === "photo_upload") {
    const photos = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        <label className="block text-xs md:text-sm font-bold uppercase text-[#031B4E] tracking-wide">
          {field.label}
        </label>
        {field.helpText && (
          <p className="text-xs text-slate-500 font-medium">{field.helpText}</p>
        )}
        <MediaEngine
          photos={photos}
          onPhotosChange={(newPhotos) => onChange(newPhotos)}
        />
        {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
      </div>
    );
  }

  if (field.type === "radio" && field.options) {
    const strVal = String(value ?? field.defaultValue ?? "");

    return (
      <div className="space-y-2">
        <label className="block text-xs md:text-sm font-bold uppercase text-[#031B4E] tracking-wide">
          {field.label}
        </label>
        <div className="flex flex-wrap gap-2.5">
          {field.options.map((opt: QuestionOption) => {
            const isSelected = strVal === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={cn(
                  "pressable min-h-[48px] min-w-[48px] px-5 py-2.5 rounded-2xl border text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2",
                  isSelected
                    ? "border-[#E4B547] bg-[#E4B547]/15 text-[#031B4E] ring-2 ring-[#E4B547]/30 shadow-xs font-black"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
      </div>
    );
  }

  if (field.type === "dropdown" && field.options) {
    const strVal = String(value ?? "");

    return (
      <div className="space-y-1.5">
        <label className="block text-xs md:text-sm font-bold uppercase text-[#031B4E] tracking-wide">
          {field.label}
        </label>
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs md:text-sm font-medium outline-none focus:border-[#E4B547] focus:ring-2 focus:ring-[#E4B547]/20 transition-all",
            error && "border-rose-400 bg-rose-50/50"
          )}
        >
          <option value="">Select option…</option>
          {field.options.map((opt: QuestionOption) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
      </div>
    );
  }

  // Text, Number, Currency inputs
  return (
    <div className="space-y-1.5">
      <label className="block text-xs md:text-sm font-bold uppercase text-[#031B4E] tracking-wide">
        {field.label}
      </label>
      <input
        type={field.type === "number" || field.type === "currency" ? "number" : "text"}
        value={value === undefined || value === null ? "" : String(value)}
        placeholder={field.placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (field.type === "number" || field.type === "currency") {
            onChange(raw === "" ? "" : Number(raw));
          } else {
            onChange(raw);
          }
        }}
        className={cn(
          "min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs md:text-sm font-medium outline-none focus:border-[#E4B547] focus:ring-2 focus:ring-[#E4B547]/20 transition-all",
          error && "border-rose-400 bg-rose-50/50"
        )}
      />
      {field.helpText && (
        <p className="text-xs text-slate-500 font-medium">{field.helpText}</p>
      )}
      {error && <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

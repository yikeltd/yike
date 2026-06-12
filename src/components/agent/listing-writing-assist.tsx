"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  appendWritingFragment,
  applyWritingCompletion,
  buildDraftDescription,
  getWritingAssist,
  type ListingWritingContext,
  type WritingSuggestion,
} from "@/lib/listing-writing-assist";

function SuggestionChip({
  suggestion,
  onPick,
  variant = "phrase",
}: {
  suggestion: WritingSuggestion;
  onPick: (text: string) => void;
  variant?: "phrase" | "sentence" | "completion";
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(suggestion.text)}
      className={cn(
        "pressable rounded-full border px-2.5 py-1 text-left text-[11px] font-semibold transition-colors",
        variant === "sentence"
          ? "w-full rounded-xl border-navy/10 bg-white px-3 py-2 text-xs text-navy hover:border-gold/40"
          : variant === "completion"
            ? "border-gold/40 bg-gold/10 text-navy"
            : "border-navy/10 bg-surface/60 text-navy hover:border-navy/20"
      )}
    >
      {variant === "sentence" ? suggestion.text : suggestion.label}
    </button>
  );
}

export function ListingWritingAssist({
  field,
  value,
  onChange,
  context,
  className,
}: {
  field: "title" | "description";
  value: string;
  onChange: (next: string) => void;
  context: ListingWritingContext;
  className?: string;
}) {
  const assist = useMemo(
    () => getWritingAssist(context, field, value),
    [context, field, value]
  );

  const draftDescription = useMemo(
    () => (field === "description" && !value.trim() ? buildDraftDescription(context) : null),
    [context, field, value]
  );

  function insert(
    text: string,
    mode: "append" | "replace" | "complete" = "append"
  ) {
    if (mode === "replace") {
      onChange(text);
      return;
    }
    if (mode === "complete") {
      onChange(applyWritingCompletion(value, text));
      return;
    }
    onChange(appendWritingFragment(value, text));
  }

  const hasIdeas =
    assist.phrases.length > 0 ||
    assist.sentences.length > 0 ||
    assist.completions.length > 0 ||
    Boolean(draftDescription) ||
    Boolean(assist.quickPick);

  if (!hasIdeas) return null;

  return (
    <div
      className={cn(
        "space-y-2.5 rounded-xl border border-navy/8 bg-surface/30 px-3 py-3",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-navy/70">
        <Sparkles className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
        {field === "title" ? "Title ideas" : "Writing ideas"}
      </div>

      {field === "title" && assist.quickPick && !value.trim() ? (
        <button
          type="button"
          onClick={() => insert(assist.quickPick!.text, "replace")}
          className="pressable w-full rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-left text-xs font-semibold text-navy"
        >
          Suggested title: {assist.quickPick.text}
        </button>
      ) : null}

      {field === "description" && draftDescription ? (
        <button
          type="button"
          onClick={() => onChange(draftDescription)}
          className="pressable w-full rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-left text-xs font-semibold text-navy"
        >
          Draft a description from your details
        </button>
      ) : null}

      {assist.completions.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted">Finish with</p>
          <div className="flex flex-wrap gap-1.5">
            {assist.completions.map((suggestion) => (
              <SuggestionChip
                key={suggestion.id}
                suggestion={suggestion}
                onPick={(text) => insert(text, "complete")}
                variant="completion"
              />
            ))}
          </div>
        </div>
      ) : null}

      {assist.phrases.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted">
            {field === "title" ? "Add words" : "Add details"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {assist.phrases.map((suggestion) => (
              <SuggestionChip
                key={suggestion.id}
                suggestion={suggestion}
                onPick={(text) => insert(text)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {assist.sentences.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted">Try a sentence</p>
          <div className="space-y-1.5">
            {assist.sentences
              .filter((s) => field !== "title" || s.id !== "full-title" || value.trim())
              .map((suggestion) => (
                <SuggestionChip
                  key={suggestion.id}
                  suggestion={suggestion}
                  onPick={(text) =>
                    insert(text, field === "title" && !value.trim() ? "replace" : "append")
                  }
                  variant="sentence"
                />
              ))}
          </div>
        </div>
      ) : null}

      {field === "description" ? (
        <p className="text-[10px] leading-relaxed text-muted">{assist.tip}</p>
      ) : null}
    </div>
  );
}

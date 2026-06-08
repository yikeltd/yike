"use client";

import { useMemo, useState } from "react";
import { generateHumanChallenge, validateHumanAnswer } from "@/lib/human-verify";
import { Input } from "@/components/ui/input";

export function HumanVerifyField({
  onValidChange,
  className,
}: {
  onValidChange?: (valid: boolean) => void;
  className?: string;
}) {
  const challenge = useMemo(() => generateHumanChallenge(), []);
  const [answer, setAnswer] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = validateHumanAnswer(challenge.a, challenge.b, answer);
  const showError = touched && !valid && answer.length > 0;

  function handleChange(value: string) {
    setAnswer(value);
    onValidChange?.(validateHumanAnswer(challenge.a, challenge.b, value));
  }

  return (
    <label className={className}>
      <span className="text-xs font-semibold text-navy">Quick verification</span>
      <Input
        name="human_verify"
        type="number"
        inputMode="numeric"
        autoComplete="off"
        placeholder={`${challenge.a} + ${challenge.b} = ?`}
        value={answer}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        required
        className="mt-1.5"
        aria-invalid={showError}
      />
      {showError && (
        <p className="mt-1 text-xs text-danger">Incorrect answer. Try again.</p>
      )}
      <input type="hidden" name="human_a" value={challenge.a} />
      <input type="hidden" name="human_b" value={challenge.b} />
    </label>
  );
}

export function readHumanVerifyFromForm(form: FormData): {
  ok: boolean;
  error?: string;
} {
  const a = Number(form.get("human_a"));
  const b = Number(form.get("human_b"));
  const answer = form.get("human_verify");
  if (!validateHumanAnswer(a, b, answer as string)) {
    return { ok: false, error: "Please solve the simple math check correctly." };
  }
  return { ok: true };
}

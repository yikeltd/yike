/** Basic profanity/spam filter for review text — not exhaustive, admin moderates rest. */

const BLOCKED_PATTERNS = [
  /\b(f+u+c+k|sh+i+t|b+i+t+c+h|asshole|bastard|damn)\b/i,
  /\b(kill|murder|threat)\b/i,
  /\b(scam+er?|fraud+ster?)\b/i,
  /(.)\1{6,}/, // repeated chars spam
  /(https?:\/\/|www\.)/i, // no URLs in reviews
  /\b\d{10,}\b/, // long number sequences (NIN/phone leaks)
];

const SPAM_PHRASES = [
  "click here",
  "free money",
  "whatsapp me for",
  "call me on",
  "dm me",
];

export type ModerationResult = {
  ok: boolean;
  reason?: string;
};

export function moderateReviewText(body: string): ModerationResult {
  const trimmed = body.trim();
  if (trimmed.length < 10) {
    return { ok: false, reason: "Review must be at least 10 characters." };
  }
  if (trimmed.length > 1000) {
    return { ok: false, reason: "Review must be under 1000 characters." };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: "Review contains blocked content. Keep it factual and respectful." };
    }
  }

  const lower = trimmed.toLowerCase();
  for (const phrase of SPAM_PHRASES) {
    if (lower.includes(phrase)) {
      return { ok: false, reason: "Review looks like spam. Avoid contact details and promotional text." };
    }
  }

  return { ok: true };
}

export function moderateReplyText(body: string): ModerationResult {
  const trimmed = body.trim();
  if (trimmed.length < 1) {
    return { ok: false, reason: "Reply cannot be empty." };
  }
  if (trimmed.length > 500) {
    return { ok: false, reason: "Reply must be under 500 characters." };
  }
  return moderateReviewText(trimmed);
}

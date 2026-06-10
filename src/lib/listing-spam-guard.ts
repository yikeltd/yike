/** Naija-aware spam heuristics — block obvious abuse, flag weak copy for admin review. */

const SCAM_PHRASES = [
  "pay before viewing",
  "no inspection needed",
  "send money first",
  "wire transfer only",
  "bitcoin only",
  "double your money",
  "free money",
  "click this link",
  "win money",
  "whatsapp me on",
];

const COPY_PASTE_FLOOD = [
  "urgent urgent urgent",
  "call call call",
  "cheap cheap cheap",
];

const URL_PATTERN = /https?:\/\/|www\./i;

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function meaningfulLength(text: string): number {
  return text.replace(/[^a-z0-9]/gi, "").length;
}

function countPhoneLike(text: string): number {
  const matches = text.match(/(\+?234|0)[789]\d{9}/g);
  return matches?.length ?? 0;
}

function hasExcessiveRepeats(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  const freq = new Map<string, number>();
  for (const w of words) {
    const key = w.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (key.length < 2) continue;
    freq.set(key, (freq.get(key) ?? 0) + 1);
    if ((freq.get(key) ?? 0) >= 5) return true;
  }
  if (/(.)\1{8,}/.test(text)) return true;
  if (/(\b\w+\b)(\s+\1){4,}/i.test(text)) return true;
  return false;
}

function isSymbolsOnly(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  return letters.length === 0 && text.trim().length > 0;
}

function isGarbageWords(text: string): boolean {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const garbage = words.filter(
    (w) => /^(.)\1{3,}$/i.test(w) || (w.length <= 2 && !/^\d+$/.test(w))
  );
  return garbage.length >= Math.ceil(words.length * 0.6);
}

export type SpamAnalysis = {
  block: boolean;
  reason?: string;
  flags: string[];
};

export function analyzeListingSpam(input: {
  title: string;
  description?: string | null;
}): SpamAnalysis {
  const flags: string[] = [];
  const title = input.title.trim();
  const desc = (input.description ?? "").trim();
  const blob = normalize(`${title} ${desc}`);

  if (!title) {
    return { block: true, reason: "Add a title for your listing.", flags: ["empty_title"] };
  }

  if (meaningfulLength(title) < 4) {
    return { block: true, reason: "Title is too short.", flags: ["short_title"] };
  }

  for (const phrase of SCAM_PHRASES) {
    if (blob.includes(phrase)) {
      flags.push("scam_phrase");
      return {
        block: true,
        reason: "This wording looks like a common scam pattern. Please revise.",
        flags,
      };
    }
  }

  if (desc && URL_PATTERN.test(desc)) {
    flags.push("spam_link");
    return {
      block: true,
      reason: "Links are not allowed in the description.",
      flags,
    };
  }

  for (const phrase of COPY_PASTE_FLOOD) {
    if (blob.includes(phrase)) {
      flags.push("copy_flood");
      return {
        block: true,
        reason: "Repeated spam wording detected. Please write naturally.",
        flags,
      };
    }
  }

  if (countPhoneLike(blob) >= 4) {
    flags.push("phone_stuffing");
    return {
      block: true,
      reason: "Too many phone numbers in the description.",
      flags,
    };
  }

  if (desc) {
    if (meaningfulLength(desc) < 15) {
      return {
        block: true,
        reason: "Please add a short description of the property.",
        flags: ["short_description"],
      };
    }

    if (isSymbolsOnly(desc)) {
      return {
        block: true,
        reason: "Please add a short description of the property.",
        flags: ["symbols_only"],
      };
    }

    if (hasExcessiveRepeats(desc) || isGarbageWords(desc)) {
      return {
        block: true,
        reason: "Please add a short description of the property.",
        flags: ["repeat_spam"],
      };
    }

    if (desc.length < 50 || /strategic location|very nice|good house|nice place/i.test(desc)) {
      flags.push("weak_description");
    }
  }

  if (flags.includes("weak_description")) {
    flags.push("needs_admin_review");
  }

  return { block: false, flags };
}

export function moderationFlagsFromSpam(flags: string[]): string[] {
  const out = new Set<string>();
  for (const flag of flags) {
    if (flag === "weak_description") out.add("weak_description");
    if (flag === "needs_admin_review") out.add("needs_admin_review");
  }
  return [...out];
}

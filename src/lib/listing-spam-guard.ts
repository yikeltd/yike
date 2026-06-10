/** Naija-aware lightweight spam heuristics — block obvious abuse, not local voice. */

const SCAM_PHRASES = [
  "pay before viewing",
  "no inspection needed",
  "send money first",
  "wire transfer only",
  "bitcoin only",
  "double your money",
  "free money",
  "click this link",
  "whatsapp me on",
];

const COPY_PASTE_FLOOD = [
  "urgent urgent urgent",
  "call call call",
  "cheap cheap cheap",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function countPhoneLike(text: string): number {
  const matches = text.match(/(\+?234|0)[789]\d{9}/g);
  return matches?.length ?? 0;
}

function hasExcessiveRepeats(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;
  const freq = new Map<string, number>();
  for (const w of words) {
    const key = w.replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (key.length < 3) continue;
    freq.set(key, (freq.get(key) ?? 0) + 1);
    if ((freq.get(key) ?? 0) >= 6) return true;
  }
  if (/(.)\1{8,}/.test(text)) return true;
  if (/(\b\w+\b)(\s+\1){4,}/i.test(text)) return true;
  return false;
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

  if (title.length < 4) {
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

  if (desc && hasExcessiveRepeats(desc)) {
    flags.push("repeat_spam");
    return {
      block: true,
      reason: "Description looks like spam. Please write normally.",
      flags,
    };
  }

  if (desc && /^(.{1,12}\s*){8,}$/.test(desc) && !/[.!?]/.test(desc)) {
    flags.push("nonsense");
    return {
      block: true,
      reason: "Description does not look genuine. Add real property details.",
      flags,
    };
  }

  return { block: false, flags };
}

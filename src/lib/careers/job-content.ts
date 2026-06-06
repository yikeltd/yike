function linesToBullets(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-•*]\s*/, ""));
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Split legacy jobs that stored the full role pitch in short_description only. */
function legacyBulletsFromSummary(shortDescription: string): string[] {
  const youWillMatch = shortDescription.match(
    /\.\s*You will (.+?)(?:\.|$)/i
  );
  if (!youWillMatch) return [];

  const clause = youWillMatch[1].trim();
  const parts = clause
    .split(/,\s*(?:and\s+)?|,\s+| and /i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part) => capitalizeSentence(part));
}

function legacySummaryFromDescription(shortDescription: string): string | null {
  const match = shortDescription.match(/^(.+?)\.\s*You will /i);
  if (!match) return null;
  return `${match[1].trim()}.`;
}

export function resolveJobContent(job: {
  short_description: string;
  responsibilities?: string | null;
}): { summary: string; responsibilities: string[] } {
  const stored = linesToBullets(job.responsibilities ?? "");
  if (stored.length > 0) {
    return { summary: job.short_description, responsibilities: stored };
  }

  const legacyBullets = legacyBulletsFromSummary(job.short_description);
  if (legacyBullets.length === 0) {
    return { summary: job.short_description, responsibilities: [] };
  }

  return {
    summary:
      legacySummaryFromDescription(job.short_description) ??
      job.short_description,
    responsibilities: legacyBullets,
  };
}

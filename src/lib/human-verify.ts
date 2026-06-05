/** Lightweight anti-spam: random addition 1–19 + 1–19 */

export function generateHumanChallenge(): { a: number; b: number } {
  const a = Math.floor(Math.random() * 19) + 1;
  const b = Math.floor(Math.random() * 19) + 1;
  return { a, b };
}

export function validateHumanAnswer(
  a: number,
  b: number,
  answer: string | number | null | undefined
): boolean {
  if (answer === null || answer === undefined || answer === "") return false;
  const n = Number(String(answer).trim());
  return Number.isFinite(n) && n === a + b;
}

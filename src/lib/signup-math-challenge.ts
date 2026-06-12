export function createMathChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export function validateMathChallenge(
  a: number,
  b: number,
  answer: number
): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(answer)) {
    return false;
  }
  if (a < 1 || a > 9 || b < 1 || b > 9) return false;
  return a + b === answer;
}

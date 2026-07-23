export const PIN_LENGTH = 6;
export const PIN_RE = /^\d{6}$/;

/** Generic weak-PIN message — do not reveal detection rules to clients. */
export const WEAK_PIN_MESSAGE =
  "Choose a less predictable PIN for better security.";

/**
 * Explicit denylist of common / patterned PINs.
 * Pattern detectors below catch many more; this covers well-known examples.
 */
const COMMON_WEAK_PINS = new Set([
  "000000",
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "012345",
  "123456",
  "234567",
  "345678",
  "456789",
  "567890",
  "678901",
  "789012",
  "890123",
  "901234",
  "987654",
  "876543",
  "765432",
  "654321",
  "543210",
  "432109",
  "321098",
  "210987",
  "109876",
  "098765",
  "121212",
  "212121",
  "123123",
  "321321",
  "112233",
  "223344",
  "334455",
  "445566",
  "556677",
  "667788",
  "778899",
  "654654",
  "456456",
  "135790",
  "975310",
  "246810",
  "024680",
  "135791",
  "246802",
  "010101",
  "101010",
  "202020",
  "303030",
  "111222",
  "222111",
  "000111",
  "111000",
  "123321",
  "321123",
  "147147",
  "258258",
  "369369",
  "147258",
  "159357",
  "753159",
  "102030",
  "112211",
  "121121",
]);

function isAllSameDigit(pin: string): boolean {
  return /^(\d)\1{5}$/.test(pin);
}

/** Full 6-digit ascending or descending run (e.g. 123456, 654321). */
function isFullSequential(pin: string): boolean {
  let ascending = true;
  let descending = true;
  for (let i = 1; i < pin.length; i += 1) {
    const prev = Number(pin[i - 1]);
    const curr = Number(pin[i]);
    if (curr !== prev + 1) ascending = false;
    if (curr !== prev - 1) descending = false;
  }
  return ascending || descending;
}

/** ABABAB, ABCABC, AABBCC-style repeating structures. */
function isRepeatingStructure(pin: string): boolean {
  const ab = pin.slice(0, 2);
  if (ab === pin.slice(2, 4) && ab === pin.slice(4, 6)) return true;

  const abc = pin.slice(0, 3);
  if (abc === pin.slice(3, 6)) return true;

  const pair0 = pin[0] === pin[1];
  const pair1 = pin[2] === pin[3];
  const pair2 = pin[4] === pin[5];
  if (pair0 && pair1 && pair2) return true;

  return false;
}

export function isWeakPin(pin: string): boolean {
  if (!PIN_RE.test(pin)) return false;
  if (isAllSameDigit(pin)) return true;
  if (isFullSequential(pin)) return true;
  if (COMMON_WEAK_PINS.has(pin)) return true;
  if (isRepeatingStructure(pin)) return true;
  return false;
}

export function pinChecks(pin: string) {
  const length = PIN_RE.test(pin);
  return {
    length,
    notWeak: length && !isWeakPin(pin),
  };
}

export function isStrongPin(pin: string): boolean {
  const checks = pinChecks(pin);
  return checks.length && checks.notWeak;
}

export function pinPolicyError(pin: string): string | null {
  if (!pin) return "PIN is required";
  if (!PIN_RE.test(pin)) return "PIN must be exactly 6 digits";
  if (isWeakPin(pin)) return WEAK_PIN_MESSAGE;
  return null;
}

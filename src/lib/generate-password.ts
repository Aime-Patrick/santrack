/**
 * Generate a random password suitable for initial account provisioning.
 * Meets SanTrack policy: ≥12 chars, letter + digit, no ambiguous glyphs.
 */
export function generatePassword(length = 14): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const alphabet = letters + digits;
  const size = Math.max(length, 12);
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);

  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]!);
  // Guarantee policy shape even if random draw was letters-only or digits-only.
  chars[0] = letters[bytes[0]! % letters.length]!;
  chars[1] = digits[bytes[1]! % digits.length]!;

  // Fisher–Yates shuffle so the guaranteed chars are not always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

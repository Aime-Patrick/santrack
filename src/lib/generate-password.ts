/**
 * Generate a random password suitable for initial account provisioning.
 * Uses crypto.getRandomValues for secure randomness.
 * Excludes ambiguous characters (0, O, l, 1, I).
 */
export function generatePassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

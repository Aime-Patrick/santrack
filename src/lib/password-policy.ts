import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 12 characters and include a letter and a number";

const BLOCKED = new Set(
  [
    "password",
    "password1",
    "password12",
    "password123",
    "admin123",
    "admin1234",
    "admin12345",
    "rsb123",
    "rica123",
    "mfg123",
    "wh123",
    "shop123",
    "fda_admin123",
    "12345678",
    "123456789",
    "1234567890",
    "qwerty123",
    "letmein123",
    "welcome123",
    "changeme123",
    "santrack123",
  ].map((p) => p.toLowerCase()),
);

export function isPasswordAllowed(password: string): boolean {
  const value = password.trim();
  if (value.length < PASSWORD_MIN_LENGTH) return false;
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return false;
  if (BLOCKED.has(value.toLowerCase())) return false;
  return true;
}

/** Zod field for new / changed passwords (not login — login only needs non-empty). */
export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE)
  .refine(isPasswordAllowed, { message: PASSWORD_POLICY_MESSAGE });

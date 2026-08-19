export const locales = ["en", "kin", "sw"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  kin: "Kinyarwanda",
  sw: "Swahili",
};

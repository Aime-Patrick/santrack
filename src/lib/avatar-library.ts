import { Avatar, Style, type StyleDefinition } from "@dicebear/core";
import avataaars from "@dicebear/styles/avataaars.json";
import bottts from "@dicebear/styles/bottts.json";
import lorelei from "@dicebear/styles/lorelei.json";
import notionists from "@dicebear/styles/notionists.json";

/** Curated local DiceBear styles (bundled — no CDN). */
export const AVATAR_STYLES = [
  "notionists",
  "avataaars",
  "lorelei",
  "bottts",
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

const STYLE_DEFS: Record<AvatarStyle, StyleDefinition> = {
  notionists: notionists as StyleDefinition,
  avataaars: avataaars as StyleDefinition,
  lorelei: lorelei as StyleDefinition,
  bottts: bottts as StyleDefinition,
};

const STYLE_CACHE = new Map<AvatarStyle, Style>();

function styleFor(name: AvatarStyle): Style {
  let cached = STYLE_CACHE.get(name);
  if (!cached) {
    cached = new Style(STYLE_DEFS[name]);
    STYLE_CACHE.set(name, cached);
  }
  return cached;
}

const SEEDS = [
  "Amina",
  "Kwame",
  "Imani",
  "Jabari",
  "Nia",
  "Kofi",
  "Zuri",
  "Tariq",
  "Asha",
  "Malik",
  "Sana",
  "Omar",
  "Lina",
  "Felix",
  "Nova",
  "Leo",
  "Maya",
  "Sam",
  "Riley",
  "Jordan",
  "Casey",
  "Quinn",
  "Alex",
  "Sky",
] as const;

/** Stored in DB / API — not a remote URL. */
export function libraryAvatarRef(style: AvatarStyle, seed: string): string {
  return `dicebear:${style}:${seed}`;
}

const LIBRARY_REF_RE =
  /^dicebear:(notionists|avataaars|lorelei|bottts):([A-Za-z0-9_-]+)$/;

/** Legacy CDN URLs from the first avatar iteration. */
const LEGACY_CDN_RE =
  /^https:\/\/api\.dicebear\.com\/9\.x\/(notionists|avataaars|lorelei|bottts)\/svg\?seed=([A-Za-z0-9_-]+)$/;

export function parseLibraryAvatarRef(
  value: string | null | undefined,
): { style: AvatarStyle; seed: string } | null {
  if (!value) return null;
  const local = LIBRARY_REF_RE.exec(value);
  if (local) {
    return { style: local[1] as AvatarStyle, seed: local[2] };
  }
  const legacy = LEGACY_CDN_RE.exec(value);
  if (legacy) {
    return { style: legacy[1] as AvatarStyle, seed: legacy[2] };
  }
  return null;
}

export function isLibraryAvatarRef(value: string | null | undefined): boolean {
  return parseLibraryAvatarRef(value) !== null;
}

/** Build an SVG data URL from the local DiceBear packages. */
export function renderLibraryAvatarDataUrl(
  style: AvatarStyle,
  seed: string,
  size = 128,
): string {
  const svg = new Avatar(styleFor(style), { seed, size }).toString();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function resolveAvatarSrc(
  avatarUrl: string | null | undefined,
): string | null {
  const parsed = parseLibraryAvatarRef(avatarUrl);
  if (parsed) {
    return renderLibraryAvatarDataUrl(parsed.style, parsed.seed);
  }
  // Uploaded photos use blob URLs elsewhere; ignore other strings.
  if (avatarUrl?.startsWith("data:") || avatarUrl?.startsWith("blob:")) {
    return avatarUrl;
  }
  return null;
}

export type LibraryAvatar = {
  id: string;
  style: AvatarStyle;
  seed: string;
  /** Stable library ref stored on the user profile. */
  ref: string;
  /** Local data URL for <img> preview. */
  src: string;
};

/** Flat gallery used by the profile picker. */
export const LIBRARY_AVATARS: LibraryAvatar[] = AVATAR_STYLES.flatMap((style) =>
  SEEDS.slice(0, 12).map((seed) => ({
    id: `${style}-${seed}`,
    style,
    seed,
    ref: libraryAvatarRef(style, seed),
    src: renderLibraryAvatarDataUrl(style, seed, 96),
  })),
);

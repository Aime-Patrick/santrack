const TOKEN_KEY = "auth_token";
/** Non-secret marker so Next middleware can redirect without reading the JWT. */
const SESSION_MARKER = "santrack_auth";

function sessionMaxAgeSeconds(): number {
  return 8 * 60 * 60;
}

/**
 * Stores a bearer fallback in sessionStorage (not localStorage) and a
 * non-HttpOnly marker cookie for edge redirects. The real JWT also lives in
 * an HttpOnly cookie on the API host (`santrack_session`).
 */
export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(TOKEN_KEY);
  const maxAge = sessionMaxAgeSeconds();
  document.cookie = `${SESSION_MARKER}=1; path=/; max-age=${maxAge}; samesite=lax`;
  // Clear legacy readable JWT cookie if present.
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  window.dispatchEvent(new Event("santrack-auth-changed"));
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${SESSION_MARKER}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  window.dispatchEvent(new Event("santrack-auth-changed"));
};

export const hasSessionMarker = () => {
  if (typeof window === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${SESSION_MARKER}=`));
};

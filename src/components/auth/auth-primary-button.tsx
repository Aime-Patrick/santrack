import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

/**
 * The one primary-action style for every auth form (login, register,
 * forgot-password, reset-password, change-password): the Rwanda flag
 * gradient. Kept in one place so no form drifts into its own button.
 */
export const AUTH_PRIMARY_BUTTON =
  "w-full h-11 sm:h-12 rounded-lg font-semibold text-white text-sm sm:text-base " +
  "tracking-wide bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] " +
  "hover:opacity-95 hover:shadow-lg hover:shadow-sky-500/20 active:scale-[0.99] " +
  "transition-all duration-200 flex items-center justify-center " +
  "cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed";

interface AuthPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingLabel?: string;
}

/** Full-width Rwanda-gradient submit button shared by every auth form. */
export function AuthPrimaryButton({
  loading = false,
  loadingLabel = "Please wait…",
  className = "",
  children,
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button type="submit" {...props} className={`${AUTH_PRIMARY_BUTTON} ${className}`}>
      {loading ? (
        <>
          <LoaderCircle className="mr-2 size-4 animate-spin text-white" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

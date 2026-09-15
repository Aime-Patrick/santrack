import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";

/**
 * The one primary-action style for every auth form (login, register,
 * forgot-password, reset-password, change-password): the Rwanda flag
 * gradient. Kept in one place so no form drifts into its own button.
 */
const AUTH_PRIMARY_ACTION =
  "rounded-lg font-semibold text-white tracking-wide " +
  "bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] " +
  "hover:opacity-95 hover:shadow-lg hover:shadow-sky-500/20 active:scale-[0.99] " +
  "transition-all duration-200 flex items-center justify-center " +
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066d6] focus-visible:ring-offset-2";

export const AUTH_PRIMARY_BUTTON =
  `h-11 w-full text-sm sm:h-12 sm:text-base ${AUTH_PRIMARY_ACTION} ` +
  "disabled:cursor-not-allowed disabled:opacity-70";

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

type AuthPrimaryLinkProps = ComponentProps<typeof Link> & {
  compact?: boolean;
  showBackIcon?: boolean;
};

/** Rwanda-gradient navigation action for links that should match auth submit buttons. */
export function AuthPrimaryLink({
  compact = false,
  showBackIcon = false,
  className = "",
  children,
  ...props
}: AuthPrimaryLinkProps) {
  return (
    <Link
      {...props}
      className={`${compact ? "h-9 px-4 text-xs" : "h-11 w-full px-5 text-sm sm:h-12 sm:text-base"} ${AUTH_PRIMARY_ACTION} ${className}`}
    >
      {showBackIcon ? <ArrowLeft className="mr-1.5 size-3.5" aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}

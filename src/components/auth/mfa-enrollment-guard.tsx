"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/hooks/auth";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * System admins and regulator staff must enroll TOTP before using the app.
 */
export function MfaEnrollmentGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  useEffect(() => {
    if (DESIGN_MODE || !me?.mustEnableMfa) return;
    if (pathname.startsWith("/mfa/setup") || pathname === "/change-password") return;
    if (me.mustChangePassword) return;
    router.replace("/mfa/setup");
  }, [me, pathname, router]);

  return <>{children}</>;
}

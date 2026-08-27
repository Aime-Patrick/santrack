"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/hooks/auth";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * Invited / reset accounts must set their own password before using the app.
 */
export function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  useEffect(() => {
    if (DESIGN_MODE || !me?.mustChangePassword) return;
    if (pathname === "/change-password") return;
    router.replace("/change-password");
  }, [me, pathname, router]);

  return <>{children}</>;
}

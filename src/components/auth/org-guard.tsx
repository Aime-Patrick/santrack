"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/auth";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * Sends users whose account has no organization yet through onboarding.
 * Design mode skips the check so the flow can be previewed freely.
 */
export function OrgGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  useEffect(() => {
    if (DESIGN_MODE || !me) return;
    if (me.mustChangePassword) {
      router.replace("/change-password");
      return;
    }
    if (me.role !== "SYSTEM_ADMIN" && !me.organization) {
      router.replace("/onboarding");
    }
  }, [me, router]);

  return <>{children}</>;
}

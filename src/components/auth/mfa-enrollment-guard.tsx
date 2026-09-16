"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useMe } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";
const DISMISS_KEY = "santrack_mfa_nudge_dismissed";

/**
 * Soft prompt after login when 2FA is off. Never blocks the app — users can
 * dismiss with "Not now", or open Security settings with "Got it".
 */
export function MfaEnrollmentGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (DESIGN_MODE || !me) return;
    if (me.mfaEnabled || me.mustChangePassword) {
      setOpen(false);
      return;
    }
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1") {
      setOpen(false);
      return;
    }
    // Already on the place they'd go — don't stack another prompt.
    if (
      pathname.startsWith("/mfa/setup") ||
      pathname.startsWith("/dashboard/settings")
    ) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [me, pathname]);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  }

  function goToSecurity() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
    router.push("/dashboard/settings?tab=security");
  }

  return (
    <>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) dismiss();
        }}
      >
        <DialogPopup className="max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-white">
              <ShieldCheck className="size-5" />
            </div>
            <DialogTitle>Protect your account with 2FA</DialogTitle>
            <DialogDescription>
              For better security, enable two-factor authentication with an
              authenticator app. You can turn it on or off anytime in Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={dismiss}>
              Not now
            </Button>
            <Button type="button" onClick={goToSecurity}>
              Got it
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}

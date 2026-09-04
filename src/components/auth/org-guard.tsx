"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock3, MailCheck, ShieldX } from "lucide-react";
import { useMe } from "@/hooks/auth";
import type { OrganizationResponse } from "@/lib/api";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * Keeps accounts pointed at the right place before they can work:
 *  - no organization yet          -> onboarding ("business application")
 *  - registration under review    -> pending status screen
 *  - registration rejected        -> rejection screen with the reason
 *  - anything else                -> the dashboard content
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

  const organization = me?.organization ?? null;
  if (DESIGN_MODE || !me) {
    return <>{children}</>;
  }

  if (organization?.onboardingStatus === "PENDING") {
    return <RegistrationStatusScreen organization={organization} />;
  }
  if (organization?.onboardingStatus === "REJECTED") {
    return (
      <RegistrationStatusScreen organization={organization} rejected />
    );
  }

  return <>{children}</>;
}

function RegistrationStatusScreen({
  organization,
  rejected = false,
}: {
  organization: OrganizationResponse;
  rejected?: boolean;
}) {
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ring-1 animate-in zoom-in duration-300 ${
            rejected
              ? "bg-red-50 ring-red-200"
              : "bg-sky-50 ring-sky-200"
          }`}
        >
          {rejected ? (
            <ShieldX className="size-8 text-red-500" strokeWidth={2.2} />
          ) : (
            <Clock3 className="size-8 text-[#067eda]" strokeWidth={2.2} />
          )}
        </div>

        <h1 className="mt-6 text-xl font-bold tracking-tight text-foreground">
          {rejected
            ? "Registration needs attention"
            : "Registration under review"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {rejected ? (
            <>
              <span className="font-semibold text-foreground">
                {organization.name}
              </span>{" "}
              was not approved.
              {organization.rejectionReason ? (
                <>
                  {" "}
                  Reason: <span className="font-medium text-foreground">
                    {organization.rejectionReason}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">
                {organization.name}
              </span>{" "}
              is submitted and waiting for a regulator to review it. You can
              work on the platform once your registration is approved.
            </>
          )}
        </p>

        <div
          className={`mx-auto mt-6 w-full space-y-2 rounded-xl border p-4 text-left ${
            rejected ? "border-red-200 bg-red-50" : "border-slate-200 bg-muted/40"
          }`}
        >
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-[#067eda]" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {rejected
                ? "Fix the issues above, then reach out to the reviewing regulator or re-register your business."
                : "You will receive an email as soon as a decision is made — keep an eye on your inbox."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

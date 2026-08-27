"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCapabilities } from "@/hooks/permissions";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  capabilitiesForRoute,
  routeRequiresTradingOrg,
} from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Stops a page rendering for someone who may not have it.
 *
 * Hiding the link in the sidebar is a courtesy; this is the control. Before it
 * existed, every dashboard page was one typed URL away from anyone signed in —
 * the API refused the data, so the screen came up empty and looked like a bug
 * rather than a boundary.
 *
 * This is not the security boundary either. That is the API, which checks the
 * same capability on every request and does not trust the browser. What this
 * buys is an honest answer: you are not permitted here, rather than a table
 * that never loads.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const permissions = useCapabilities();
  const { data: me } = useCurrentUser();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const required = capabilitiesForRoute(pathname);
  const needsTradingOrg = routeRequiresTradingOrg(pathname);
  const isTradingOrg =
    !!me?.organization && me.organization.type !== "REGULATOR";

  // Deciding before /me lands would flash "not permitted" at people who are.
  // On the server we always show loading; the client waits one tick to avoid
  // a hydration mismatch when auth resolves instantly from a cache.
  if (!hydrated || permissions.loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (needsTradingOrg && !isTradingOrg) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-danger/10">
          <ShieldOff className="size-6 text-danger" />
        </div>

        <h1 className="mt-5 text-lg font-bold tracking-tight text-foreground">
          This screen is for trading businesses
        </h1>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Licensing authorities review applications and oversee industries —
          they do not apply for operating licences or run factory reports here.
          Use License Review and Industries instead.
        </p>

        <Button className="mt-6" render={<Link href="/dashboard" />} nativeButton={false}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (permissions.canAll(required)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-danger/10">
        <ShieldOff className="size-6 text-danger" />
      </div>

      <h1 className="mt-5 text-lg font-bold tracking-tight text-foreground">
        This area is not part of your role
      </h1>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your account does not hold the permission this screen needs. If you
        believe it should, your organization&apos;s administrator can change it
        under Settings.
      </p>

      <p className="mt-4 font-mono text-xs text-faint">
        Requires {required.join(" + ")}
      </p>

      <Button className="mt-6" render={<Link href="/dashboard" />} nativeButton={false}>
        Back to dashboard
      </Button>
    </div>
  );
}

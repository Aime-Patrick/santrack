"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRegulators } from "@/hooks/organizations";
import { useRegulatoryAuthorities } from "@/hooks/regulatory-authorities";
import {
  useGrantRegulatoryOversightScope,
  useRegulatoryOversightScopes,
  useRevokeRegulatoryOversightScope,
  useSetRegulatoryOversightMode,
} from "@/hooks/regulatory-oversight-config";
import type { RegulatoryOversightMode } from "@/services/regulatory-oversight.service";
import { cn } from "@/lib/utils";

/**
 * System admin assigns which high regulator may observe or supervise
 * which authority desks. Creating regulator orgs stays on Regulators admin.
 */
export function OversightScopeSettings() {
  const { data: scopes = [] } = useRegulatoryOversightScopes();
  const { data: organizations = [] } = useRegulators();
  const { data: authorities = [] } = useRegulatoryAuthorities();
  const grant = useGrantRegulatoryOversightScope();
  const setMode = useSetRegulatoryOversightMode();
  const revoke = useRevokeRegulatoryOversightScope();
  const [organizationId, setOrganizationId] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [mode, setModeChoice] = useState<RegulatoryOversightMode>("SUPERVISE");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Oversight scopes</CardTitle>
        <CardDescription>
          Assign a high regulator to other authorities.{" "}
          <strong className="font-medium text-foreground">Observe</strong> is
          aggregates only.{" "}
          <strong className="font-medium text-foreground">Supervise</strong>{" "}
          lets them follow open queues and send follow-ups. Creating regulators
          stays with platform admin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_10rem_auto]">
          <select
            aria-label="Oversight organization"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
          >
            <option value="">Choose high regulator</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Authority to oversee"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={authorityId}
            onChange={(event) => setAuthorityId(event.target.value)}
          >
            <option value="">Choose authority</option>
            {authorities
              .filter((authority) => authority.isActive)
              .map((authority) => (
                <option key={authority.id} value={authority.id}>
                  {authority.name}
                </option>
              ))}
          </select>
          <select
            aria-label="Oversight mode"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={mode}
            onChange={(event) =>
              setModeChoice(event.target.value as RegulatoryOversightMode)
            }
          >
            <option value="SUPERVISE">Supervise</option>
            <option value="OBSERVE">Observe</option>
          </select>
          <Button
            disabled={!organizationId || !authorityId || grant.isPending}
            onClick={() =>
              grant.mutate(
                {
                  oversightOrganizationId: Number(organizationId),
                  authorityId: Number(authorityId),
                  mode,
                },
                { onSuccess: () => setAuthorityId("") },
              )
            }
          >
            {grant.isPending ? "Granting…" : "Grant"}
          </Button>
        </div>

        <div className="divide-y rounded-lg border border-border">
          {scopes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No oversight scopes configured.
            </p>
          ) : (
            scopes.map((scope) => (
              <div
                key={scope.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {scope.oversightOrganization.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    → {scope.authority.name} · {scope.authority.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={setMode.isPending}
                    onClick={() =>
                      setMode.mutate({
                        id: scope.id,
                        mode:
                          scope.mode === "SUPERVISE" ? "OBSERVE" : "SUPERVISE",
                      })
                    }
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer px-2.5 py-0.5 text-xs font-semibold",
                        scope.mode === "SUPERVISE"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-slate-400/40 bg-slate-500/10 text-slate-600",
                      )}
                    >
                      {scope.mode === "SUPERVISE" ? "Supervise" : "Observe"}
                    </Badge>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remove oversight scope"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(scope.id)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
          <Eye className="mt-0.5 size-3.5 shrink-0" />
          Click the mode badge to switch Observe ↔ Supervise.
        </p>
      </CardContent>
    </Card>
  );
}

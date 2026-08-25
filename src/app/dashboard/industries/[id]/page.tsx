"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, ArrowLeft, Pencil, FileText, Users, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizations } from "@/hooks/organizations";
import { useUsers } from "@/hooks/users";
import { useAuditLog } from "@/hooks/audit";
import { IndustryEditDialog } from "../edit-dialog";
import type { OrganizationResponse } from "@/lib/api";

const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
  REGULATOR: "Regulator",
  CONSUMER: "Consumer",
};

export default function IndustryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = Number(params.id);

  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const { data: users, isLoading: usersLoading } = useUsers(orgId);
  const { data: auditData, isLoading: auditLoading } = useAuditLog(20);

  const [showEdit, setShowEdit] = useState(false);

  const org = orgs?.find((o) => o.id === orgId);

  const orgUsers = users ?? [];
  const orgAudit = auditData?.entries?.filter((e) => e.path.includes(`/organizations/${orgId}`)) ?? [];

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">Organization not found</div>
        <Button variant="outline" onClick={() => router.push("/dashboard/industries")}>
          <ArrowLeft className="mr-2 size-4" /> Back to Industries
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/industries")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{org.name}</h1>
            <p className="text-sm text-muted-foreground">
              {TYPE_LABELS[org.type] ?? org.type} • ORG-{String(org.id).padStart(3, "0")}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowEdit(true)}>
          <Pencil className="mr-2 size-4" /> Edit
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
                <Building2 className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{TYPE_LABELS[org.type] ?? org.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success text-white">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="font-medium">{orgUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-warning-foreground text-white">
                <Activity className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Activity</p>
                <p className="font-medium">{orgAudit.length} events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-1.5 size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-1.5 size-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>{orgUsers.length} users in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="size-9 rounded-full bg-muted" />
                      <div className="space-y-1">
                        <div className="h-3 w-32 rounded bg-muted" />
                        <div className="h-2 w-24 rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orgUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users in this organization.</p>
              ) : (
                <div className="space-y-3">
                  {orgUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <span className="text-xs font-medium">
                            {user.fullName?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Audit trail for this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="h-3 w-48 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : orgAudit.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {orgAudit.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60">
                      <div>
                        <p className="font-medium text-sm">{entry.method} {entry.path}</p>
                        <p className="text-xs text-muted-foreground">{entry.actor}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.performedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <IndustryEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        organization={org}
      />
    </div>
  );
}

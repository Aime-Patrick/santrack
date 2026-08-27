"use client";

import { Users } from "lucide-react";
import { TeamMembersPanel } from "@/components/dashboard/team-members-panel";
import { useMe } from "@/hooks/auth";

export default function UsersPage() {
  const { data: me } = useMe();
  const isPlatform = me?.role === "SYSTEM_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Users className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {isPlatform
              ? "Create and manage accounts across organizations."
              : "Invite staff to your organization and assign roles like Quality Officer."}
          </p>
        </div>
      </div>

      <TeamMembersPanel />
    </div>
  );
}

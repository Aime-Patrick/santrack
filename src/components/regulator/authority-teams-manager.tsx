"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crown, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api";
import {
  useAddAuthorityTeamMember,
  useAuthorityTeams,
  useCreateAuthorityTeam,
  useRemoveAuthorityTeamMember,
  useUpdateAuthorityTeam,
  useUpdateAuthorityTeamMember,
} from "@/hooks/regulatory-authorities";
import { useUsers } from "@/hooks/users";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import type { RegulatoryTeam } from "@/services/regulatory-authority.service";

/**
 * Create desks, add org users as members, and mark one team leader per desk.
 * Each team is an accordion panel (one open at a time).
 */
export function AuthorityTeamsManager() {
  const { data: me } = useCurrentUser();
  const orgId = me?.organization?.id;
  const { data: teams = [], isLoading } = useAuthorityTeams(true, true);
  const { data: users = [] } = useUsers(orgId, { enabled: !!orgId });
  const createTeam = useCreateAuthorityTeam();
  const updateTeam = useUpdateAuthorityTeam();
  const addMember = useAddAuthorityTeamMember();
  const updateMember = useUpdateAuthorityTeamMember();
  const removeMember = useRemoveAuthorityTeamMember();

  const [newName, setNewName] = useState("");
  const [openTeamId, setOpenTeamId] = useState<number | null>(null);
  const [memberUserId, setMemberUserId] = useState("");
  const didInitOpen = useRef(false);

  useEffect(() => {
    if (teams.length === 0) {
      setOpenTeamId(null);
      didInitOpen.current = false;
      return;
    }
    // Open the first team once on load — do not force-reopen when the user collapses.
    if (!didInitOpen.current) {
      setOpenTeamId(teams[0].id);
      didInitOpen.current = true;
      return;
    }
    // If the open team was removed, fall back to the first remaining desk.
    if (openTeamId != null && !teams.some((team) => team.id === openTeamId)) {
      setOpenTeamId(teams[0].id);
    }
  }, [teams, openTeamId]);

  function onCreate() {
    const name = newName.trim();
    if (!name) return;
    createTeam.mutate(
      { name },
      {
        onSuccess: (team) => {
          setNewName("");
          setOpenTeamId(team.id);
          setMemberUserId("");
          didInitOpen.current = true;
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not create team")),
      },
    );
  }

  function onAddMember(team: RegulatoryTeam) {
    if (!memberUserId) return;
    addMember.mutate(
      { teamId: team.id, userId: Number(memberUserId) },
      {
        onSuccess: () => setMemberUserId(""),
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not add member")),
      },
    );
  }

  function toggleActive(team: RegulatoryTeam) {
    updateTeam.mutate(
      { teamId: team.id, active: !team.active },
      {
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not update team")),
      },
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/80 p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <Users className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">Teams</p>
          <p className="text-xs text-muted-foreground">
            Desks that handle different work. Add officers from your organization
            and mark one team leader.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New team name — e.g. Surveillance"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCreate();
            }
          }}
        />
        <Button
          type="button"
          onClick={onCreate}
          disabled={createTeam.isPending || !newName.trim()}
          className="shrink-0"
        >
          <Plus className="mr-1.5 size-3.5" />
          Add team
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading teams…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No teams yet. Create one above, then add members.
        </p>
      ) : (
        <div className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
          {teams.map((team) => {
            const open = openTeamId === team.id;
            const memberIds = new Set(team.members.map((m) => m.userId));
            const availableUsers = users.filter((user) => !memberIds.has(user.id));

            return (
              <Collapsible
                key={team.id}
                open={open}
                onOpenChange={(next) => {
                  setOpenTeamId(next ? team.id : null);
                  setMemberUserId("");
                }}
              >
                <div className="flex items-stretch gap-1 px-2 py-1.5">
                  <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-2 text-left transition-colors hover:bg-muted/40">
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        !open && "-rotate-90",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{team.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {team.members.length} member
                        {team.members.length === 1 ? "" : "s"}
                        {team.leaderUserId ? " · leader set" : " · no leader yet"}
                        {team.maxOpenCases != null
                          ? ` · cap ${team.maxOpenCases}`
                          : ""}
                      </p>
                    </div>
                  </CollapsibleTrigger>

                  <button
                    type="button"
                    className="shrink-0 self-center"
                    title={team.active ? "Deactivate team" : "Activate team"}
                    onClick={() => toggleActive(team)}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "cursor-pointer px-2.5 py-0.5 text-xs font-semibold",
                        team.active
                          ? "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                          : "border-slate-400/40 bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 dark:text-slate-300",
                      )}
                    >
                      {team.active ? "Active" : "Off"}
                    </Badge>
                  </button>
                </div>

                <CollapsibleContent className="border-t border-border/50 bg-muted/15 px-3 pb-3 pt-3 data-closed:hidden">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="w-full space-y-1.5 sm:max-w-[10rem]">
                        <Label className="text-xs">Open-case cap</Label>
                        <Input
                          type="number"
                          min={1}
                          placeholder="No limit"
                          defaultValue={team.maxOpenCases ?? ""}
                          key={`${team.id}-cap-${team.maxOpenCases ?? "none"}`}
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            const next =
                              raw === "" ? null : Math.max(1, Number(raw) || 1);
                            if (next === (team.maxOpenCases ?? null)) return;
                            updateTeam.mutate(
                              { teamId: team.id, maxOpenCases: next },
                              {
                                onError: (error) =>
                                  toast.error(
                                    getApiErrorMessage(
                                      error,
                                      "Could not update workload cap",
                                    ),
                                  ),
                              },
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Label className="text-xs">Add member</Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          value={open ? memberUserId : ""}
                          onChange={(e) => setMemberUserId(e.target.value)}
                        >
                          <option value="">Select an officer…</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.fullName || user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!memberUserId || addMember.isPending}
                        onClick={() => onAddMember(team)}
                      >
                        Add
                      </Button>
                    </div>

                    {availableUsers.length === 0 && team.members.length > 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        All organization users are already on this team. Add more
                        from Settings → Members.
                      </p>
                    ) : null}

                    <ul className="divide-y divide-border/60 rounded-md border border-border/60 bg-background">
                      {team.members.length === 0 ? (
                        <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No members yet.
                        </li>
                      ) : (
                        team.members.map((member) => (
                          <li
                            key={member.userId}
                            className="flex items-center justify-between gap-2 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {member.fullName || member.email}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant={member.isLeader ? "default" : "ghost"}
                                size="sm"
                                className="h-7 gap-1 px-2 text-[11px]"
                                title={
                                  member.isLeader
                                    ? "Team leader"
                                    : "Make team leader"
                                }
                                onClick={() =>
                                  updateMember.mutate(
                                    {
                                      teamId: team.id,
                                      userId: member.userId,
                                      isLeader: !member.isLeader,
                                    },
                                    {
                                      onError: (error) =>
                                        toast.error(
                                          getApiErrorMessage(
                                            error,
                                            "Could not update leader",
                                          ),
                                        ),
                                    },
                                  )
                                }
                              >
                                <Crown className="size-3" />
                                {member.isLeader ? "Leader" : "Lead"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-danger"
                                onClick={() =>
                                  removeMember.mutate(
                                    {
                                      teamId: team.id,
                                      userId: member.userId,
                                    },
                                    {
                                      onError: (error) =>
                                        toast.error(
                                          getApiErrorMessage(
                                            error,
                                            "Could not remove member",
                                          ),
                                        ),
                                    },
                                  )
                                }
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}

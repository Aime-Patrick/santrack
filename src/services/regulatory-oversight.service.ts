import { api } from "@/lib/api";

export type RegulatoryOversightMode = "OBSERVE" | "SUPERVISE";

export type RegulatoryOversightSummary = {
  authorities: Array<{
    authority: {
      id: number;
      code: string;
      name: string;
      isActive?: boolean;
    };
    mode: RegulatoryOversightMode;
    open: number;
    overdue: number;
    unassigned: number;
    resolved: number;
    overdueReferrals: number;
  }>;
  referrals: { pending: number; accepted: number; declined: number };
  canSupervise: boolean;
};

export type SupervisedOversightCase = {
  id: number;
  caseNumber: string | null;
  title: string;
  status: string;
  priority: string;
  dueOn: string | null;
  assignedTeam: string | null;
  assignedTo: { id: number; name: string } | null;
  organization: { id: number; name: string };
  leadAuthority: { id: number; code: string; name: string } | null;
  overdue: boolean;
};

export type SupervisedOversightLicence = {
  id: number;
  licenseNumber: string;
  status: string;
  organization: { id: number; name: string };
  issuedBy: { id: number; name: string } | null;
  category: { id: number; name: string; code: string } | null;
};

export type SupervisedPendingLicence = {
  id: number;
  licenseNumber: string;
  status: string;
  organization: {
    id: number;
    name: string;
    industrySector: string | null;
  };
  category: { id: number; name: string; code: string } | null;
  createdAt: string;
};

export type OversightLicenceOverrideAction = "SUSPEND" | "REVOKE" | "REINSTATE";

export const regulatoryOversightService = {
  summary: () =>
    api
      .get<RegulatoryOversightSummary>("/api/regulatory-oversight/summary")
      .then((r) => r.data),

  supervisedCases: (authorityId?: number) =>
    api
      .get<SupervisedOversightCase[]>("/api/regulatory-oversight/supervised-cases", {
        params: authorityId ? { authorityId } : undefined,
      })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  supervisedLicences: () =>
    api
      .get<SupervisedOversightLicence[]>(
        "/api/regulatory-oversight/supervised-licences",
      )
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  supervisedPendingLicences: () =>
    api
      .get<SupervisedPendingLicence[]>(
        "/api/regulatory-oversight/supervised-pending-licences",
      )
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  nudgeAuthority: (authorityId: number, note?: string) =>
    api
      .post<{ authorityId: number; notified: number }>(
        `/api/regulatory-oversight/authorities/${authorityId}/nudge`,
        { note },
      )
      .then((r) => r.data),

  activateAuthority: (authorityId: number) =>
    api
      .post<{ id: number; code: string; name: string; isActive: boolean }>(
        `/api/regulatory-oversight/authorities/${authorityId}/activate`,
      )
      .then((r) => r.data),

  pullUpCase: (caseId: number, reason: string) =>
    api
      .post(`/api/regulatory-oversight/cases/${caseId}/pull-up`, { reason })
      .then((r) => r.data),

  overrideLicence: (
    licenseId: number,
    action: OversightLicenceOverrideAction,
    reason: string,
  ) =>
    api
      .post<{ id: number; licenseNumber: string; status: string }>(
        `/api/regulatory-oversight/licences/${licenseId}/override`,
        { action, reason },
      )
      .then((r) => r.data),
};

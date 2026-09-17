import { api } from "@/lib/api";

export type RegulatoryCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "AWAITING_BUSINESS"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type RegulatoryCasePriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface RegulatoryCase {
  id: number;
  caseNumber: string | null;
  title: string;
  description: string | null;
  priority: RegulatoryCasePriority;
  status: RegulatoryCaseStatus;
  caseCategory: string | null;
  assignedTeam: string | null;
  dueOn: string | null;
  openedAt: string;
  organization: { id: number; name: string };
  leadAuthority: { id: number; code: string; name: string } | null;
  facility: { id: number; name: string } | null;
  license: { id: number; licenseNumber: string } | null;
  findingId: number | null;
  batch: { id: number; batchCode: string } | null;
  assignedTo: { id: number; name: string } | null;
  openedBy: { id: number | null; name: string };
}

export interface RegulatoryCaseDetail extends RegulatoryCase {
  referrals: Array<{
    id: number;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    reason: string;
    referredAt: string;
    fromAuthority: { id: number; name: string };
    toAuthority: { id: number; name: string };
    decisionNote: string | null;
    decidedAt: string | null;
  }>;
  evidence: Array<{
    id: number;
    filename: string;
    contentType: string;
    sizeBytes: number;
    note: string | null;
    submittedAt: string;
    submittedBy: { id: number; name: string };
  }>;
  events: Array<{
    id: number;
    type: "OPENED" | "ASSIGNED" | "STATUS_CHANGED" | "INSPECTION_RECORDED" | "EVIDENCE_SUBMITTED" | "DEADLINE_OVERDUE" | "DEADLINE_ESCALATED" | "RECALL_RECOVERY_RECORDED" | "NOTE_ADDED";
    summary: string;
    detail: Record<string, unknown> | null;
    actor: string;
    actorId: number;
    recordedAt: string;
  }>;
}

export type RegulatoryInspectionResult = "PASS" | "CONDITIONAL" | "FAIL";

export interface RegulatoryInspection {
  id: number;
  caseId: number;
  caseNumber?: string | null;
  caseTitle?: string;
  organization: { id: number; name: string };
  facility: { id: number; name: string } | null;
  inspector: { id: number; name: string };
  result: RegulatoryInspectionResult;
  notes: string | null;
  inspectedAt: string;
}

export interface RegulatoryOfficer {
  id: number;
  name: string;
  role: string;
}

/** A case as the affected business sees it — its own corrective-action inbox. */
export interface BusinessRegulatoryCase {
  id: number;
  caseNumber: string | null;
  title: string;
  description: string | null;
  priority: RegulatoryCasePriority;
  status: RegulatoryCaseStatus;
  caseCategory: string | null;
  dueOn: string | null;
  openedAt: string;
  leadAuthority: { id: number; code: string; name: string } | null;
  facility: { id: number; name: string } | null;
  license: { id: number; licenseNumber: string } | null;
  batch: { id: number; batchCode: string } | null;
  assignedTo: { id: number; name: string } | null;
}

export interface BusinessRegulatoryCaseDetail extends BusinessRegulatoryCase {
  evidence: RegulatoryCaseDetail["evidence"];
  events: RegulatoryCaseDetail["events"];
}

export const regulatoryCaseService = {
  open(input: {
    organizationId: number;
    title: string;
    description?: string;
    priority?: RegulatoryCasePriority;
    licenseId?: number;
    findingId?: number;
  }): Promise<RegulatoryCase> {
    return api.post<RegulatoryCase>("/api/regulator/cases", input).then((response) => response.data);
  },

  list(status?: RegulatoryCaseStatus): Promise<RegulatoryCase[]> {
    return api
      .get<RegulatoryCase[]>("/api/regulator/cases", { params: status ? { status } : undefined })
      .then((response) => response.data);
  },

  officers(): Promise<RegulatoryOfficer[]> {
    return api.get<RegulatoryOfficer[]>("/api/regulator/cases/officers").then((response) => response.data);
  },

  one(id: number): Promise<RegulatoryCaseDetail> {
    return api.get<RegulatoryCaseDetail>(`/api/regulator/cases/${id}`).then((response) => response.data);
  },

  // ── Business-facing (the case's subject organisation) ──

  /** Cases opened against my organisation — what I must respond to. */
  myCases(status?: RegulatoryCaseStatus): Promise<BusinessRegulatoryCase[]> {
    return api
      .get<BusinessRegulatoryCase[]>("/api/cases", { params: status ? { status } : undefined })
      .then((response) => response.data);
  },

  myCase(id: number): Promise<BusinessRegulatoryCaseDetail> {
    return api.get<BusinessRegulatoryCaseDetail>(`/api/cases/${id}`).then((response) => response.data);
  },

  /** Attach corrective-action proof to a case against my organisation. */
  submitEvidence(caseId: number, file: File, note?: string): Promise<{ id: number; filename: string }> {
    const formData = new FormData();
    if (note?.trim()) formData.append("note", note.trim());
    formData.append("file", file);
    return api
      .post<{ id: number; filename: string }>(`/api/cases/${caseId}/evidence`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => response.data);
  },

  async downloadMyEvidence(caseId: number, evidenceId: number, filename: string): Promise<void> {
    const response = await api.get<Blob>(`/api/cases/${caseId}/evidence/${evidenceId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "evidence";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  changeStatus(id: number, status: RegulatoryCaseStatus, note?: string): Promise<RegulatoryCase> {
    return api.post<RegulatoryCase>(`/api/regulator/cases/${id}/status`, { status, note }).then((response) => response.data);
  },

  assign(id: number, officerId: number, note?: string): Promise<RegulatoryCase> {
    return api.post<RegulatoryCase>(`/api/regulator/cases/${id}/assign`, { officerId, note }).then((response) => response.data);
  },

  assignTeam(id: number, team: string): Promise<RegulatoryCase> {
    return api.post<RegulatoryCase>(`/api/regulator/cases/${id}/team`, { team }).then((response) => response.data);
  },

  recordInspection(caseId: number, input: { result: RegulatoryInspectionResult; notes?: string }): Promise<RegulatoryInspection> {
    return api.post<RegulatoryInspection>(`/api/regulator/cases/${caseId}/inspections`, input).then((response) => response.data);
  },

  listInspections(caseId: number): Promise<RegulatoryInspection[]> {
    return api
      .get<RegulatoryInspection[]>(`/api/regulator/cases/${caseId}/inspections`)
      .then((response) => (Array.isArray(response.data) ? response.data : []));
  },

  listAuthorityInspections(limit = 50): Promise<RegulatoryInspection[]> {
    return api
      .get<RegulatoryInspection[]>(`/api/regulator/inspections`, { params: { limit } })
      .then((response) => (Array.isArray(response.data) ? response.data : []));
  },

  async downloadEvidence(caseId: number, evidenceId: number): Promise<void> {
    const response = await api.get<Blob>(`/api/regulator/cases/${caseId}/evidence/${evidenceId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "evidence";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },

  async downloadInvestigationPack(caseId: number): Promise<void> {
    const response = await api.get<Blob>(`/api/regulator/cases/${caseId}/investigation-pack`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `case-${caseId}-investigation-pack.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  },
};

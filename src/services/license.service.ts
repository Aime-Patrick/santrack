import {
  api,
  type License,
  type LicenseCategory,
  type LicenseDocument,
  type LicenseEvent,
  type ApplyLicenseInput,
  type LicenseDecision,
  type CreateLicenseCategoryInput,
  type UpdateLicenseCategoryInput,
  type LicenseFollowUp,
  type ActionFollowUpInput,
  type CreateFollowUpInput,
  type CloseFollowUpInput,
  type SendFollowUpLinkInput,
  type PublicFollowUpView,
} from "@/lib/api";

export interface ComplianceFindingRow {
  id: number;
  organizationId: number;
  organizationName: string;
  type: string;
  activity: string | null;
  action: string | null;
  licenseNumber: string | null;
  detail: string;
  recordedAt: string;
}

export interface ComplianceFindingDetail {
  id: number;
  type: string;
  activity: string | null;
  action: string | null;
  detail: string | null;
  recordedAt: string;
  organization: {
    id: number;
    name: string;
    type: string;
    tin: string | null;
    registrationNumber: string | null;
  } | null;
  license: {
    id: number;
    licenseNumber: string;
    status: string;
    expiresOn: string | null;
  } | null;
  actor: {
    id: number;
    email: string;
    fullName: string | null;
    role: string;
  } | null;
  enforcement: string;
}

export interface ComplianceFindingsResponse {
  enforcement: string;
  findings: ComplianceFindingRow[];
}

export const licenseService = {
  categories(): Promise<LicenseCategory[]> {
    return api.get<LicenseCategory[]>("/api/licenses/categories").then((r) => r.data);
  },

  allCategories(): Promise<LicenseCategory[]> {
    return api.get<LicenseCategory[]>("/api/licenses/categories/all").then((r) => r.data);
  },

  createCategory(input: CreateLicenseCategoryInput): Promise<LicenseCategory> {
    return api.post<LicenseCategory>("/api/licenses/categories", input).then((r) => r.data);
  },

  updateCategory(id: number, input: UpdateLicenseCategoryInput): Promise<LicenseCategory> {
    return api.patch<LicenseCategory>(`/api/licenses/categories/${id}`, input).then((r) => r.data);
  },

  deleteCategory(id: number): Promise<{ deleted: boolean; deactivated?: boolean; message: string }> {
    return api.delete<{ deleted: boolean; deactivated?: boolean; message: string }>(`/api/licenses/categories/${id}`).then((r) => r.data);
  },

  mine(): Promise<License[]> {
    return api.get<License[]>("/api/licenses").then((r) => r.data);
  },

  apply(input: ApplyLicenseInput): Promise<License> {
    return api.post<License>("/api/licenses", input).then((r) => r.data);
  },

  attachDocument(licenseId: number, documentType: string, file: File): Promise<LicenseDocument> {
    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("file", file);
    return api
      .post<LicenseDocument>(`/api/licenses/${licenseId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  submit(licenseId: number): Promise<License> {
    return api.post<License>(`/api/licenses/${licenseId}/submit`).then((r) => r.data);
  },

  cancel(licenseId: number): Promise<License> {
    return api.post<License>(`/api/licenses/${licenseId}/cancel`).then((r) => r.data);
  },

  documents(licenseId: number): Promise<LicenseDocument[]> {
    return api.get<LicenseDocument[]>(`/api/licenses/${licenseId}/documents`).then((r) => r.data);
  },

  /**
   * The bytes of one certificate.
   *
   * Fetched rather than linked: the route needs the bearer token, which an
   * href cannot carry, and in development the API is a different origin from
   * the app - a relative link resolves against Next, which has no such route.
   */
  downloadDocument(documentId: number): Promise<Blob> {
    return api
      .get<Blob>(`/api/licenses/documents/${documentId}`, {
        responseType: "blob",
      })
      .then((r) => r.data);
  },

  regulatorDocuments(licenseId: number): Promise<LicenseDocument[]> {
    return api.get<LicenseDocument[]>(`/api/regulator/licenses/${licenseId}/documents`).then((r) => r.data);
  },

  history(licenseId: number): Promise<LicenseEvent[]> {
    return api.get<LicenseEvent[]>(`/api/licenses/${licenseId}/history`).then((r) => r.data);
  },

  // Regulator side
  queue(): Promise<License[]> {
    return api.get<License[]>("/api/regulator/licenses/queue").then((r) => r.data);
  },

  findings(): Promise<ComplianceFindingsResponse> {
    return api
      .get<ComplianceFindingsResponse>("/api/regulator/licenses/findings")
      .then((r) => r.data);
  },

  finding(id: number): Promise<ComplianceFindingDetail> {
    return api
      .get<ComplianceFindingDetail>(`/api/regulator/licenses/findings/${id}`)
      .then((r) => r.data);
  },

  review(licenseId: number): Promise<License> {
    return api.post<License>(`/api/regulator/licenses/${licenseId}/review`).then((r) => r.data);
  },

  decide(licenseId: number, decision: LicenseDecision): Promise<License> {
    return api.post<License>(`/api/regulator/licenses/${licenseId}/decision`, decision).then((r) => r.data);
  },

  suspend(licenseId: number, reason: string): Promise<License> {
    return api.post<License>(`/api/regulator/licenses/${licenseId}/suspend`, { reason }).then((r) => r.data);
  },

  reinstate(licenseId: number): Promise<License> {
    return api.post<License>(`/api/regulator/licenses/${licenseId}/reinstate`).then((r) => r.data);
  },

  revoke(licenseId: number, reason: string): Promise<License> {
    return api.post<License>(`/api/regulator/licenses/${licenseId}/revoke`, { reason }).then((r) => r.data);
  },

  renew(licenseId: number): Promise<License> {
    return api.post<License>(`/api/licenses/${licenseId}/renew`).then((r) => r.data);
  },

  // Follow-ups & Conditions
  getFollowUps(licenseId: number): Promise<LicenseFollowUp[]> {
    return api.get<LicenseFollowUp[]>(`/api/licenses/${licenseId}/follow-ups`).then((r) => r.data);
  },

  actionFollowUp(licenseId: number, followUpId: number, input: ActionFollowUpInput): Promise<LicenseFollowUp> {
    return api.post<LicenseFollowUp>(`/api/licenses/${licenseId}/follow-ups/${followUpId}/action`, input).then((r) => r.data);
  },

  getRegulatorFollowUps(licenseId: number): Promise<LicenseFollowUp[]> {
    return api.get<LicenseFollowUp[]>(`/api/regulator/licenses/${licenseId}/follow-ups`).then((r) => r.data);
  },

  createFollowUp(licenseId: number, input: CreateFollowUpInput): Promise<LicenseFollowUp> {
    return api.post<LicenseFollowUp>(`/api/regulator/licenses/${licenseId}/follow-ups`, input).then((r) => r.data);
  },

  closeFollowUp(licenseId: number, followUpId: number, input: CloseFollowUpInput): Promise<LicenseFollowUp> {
    return api.post<LicenseFollowUp>(`/api/regulator/licenses/${licenseId}/follow-ups/${followUpId}/close`, input).then((r) => r.data);
  },

  sendFollowUpLink(licenseId: number, followUpId: number, input: SendFollowUpLinkInput): Promise<{ id: number; responseTokenExpiresAt: string }> {
    return api.post<{ id: number; responseTokenExpiresAt: string }>(`/api/regulator/licenses/${licenseId}/follow-ups/${followUpId}/send-link`, input).then((r) => r.data);
  },

  getPublicFollowUp(token: string): Promise<PublicFollowUpView> {
    return api.get<PublicFollowUpView>(`/api/public/license-followup/${token}`).then((r) => r.data);
  },

  respondToFollowUp(token: string, businessResponse: string, file?: File): Promise<{ success: boolean }> {
    const formData = new FormData();
    formData.append("businessResponse", businessResponse);
    if (file) formData.append("file", file);
    return api
      .post<{ success: boolean }>(`/api/public/license-followup/${token}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};


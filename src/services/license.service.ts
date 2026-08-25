import { api, type License, type LicenseCategory, type LicenseDocument, type LicenseEvent, type ApplyLicenseInput, type LicenseDecision } from "@/lib/api";

export const licenseService = {
  categories(): Promise<LicenseCategory[]> {
    return api.get<LicenseCategory[]>("/api/licenses/categories").then((r) => r.data);
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
};

import { api } from "@/lib/api";
import type {
  ProductRegistration,
  ProductRegistrationDocument,
  ProductRegistrationEvent,
  ApplyProductRegistrationInput,
} from "@/lib/api";

export const productRegistrationService = {
  async list(): Promise<ProductRegistration[]> {
    const res = await api.get<ProductRegistration[]>("/api/product-registrations");
    return res.data;
  },

  async queue(): Promise<ProductRegistration[]> {
    const res = await api.get<ProductRegistration[]>("/api/product-registrations/queue");
    return res.data;
  },

  async get(id: number): Promise<{
    registration: ProductRegistration;
    documents: ProductRegistrationDocument[];
    events: ProductRegistrationEvent[];
  }> {
    const res = await api.get(`/api/product-registrations/${id}`);
    return res.data;
  },

  async apply(input: ApplyProductRegistrationInput): Promise<ProductRegistration> {
    const res = await api.post<ProductRegistration>(
      "/api/product-registrations",
      input,
    );
    return res.data;
  },

  async attachDocument(
    id: number,
    documentType: string,
    file: File,
  ): Promise<ProductRegistrationDocument> {
    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("file", file);
    const res = await api.post<ProductRegistrationDocument>(
      `/api/product-registrations/${id}/documents`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },

  async submit(id: number): Promise<ProductRegistration> {
    const res = await api.post<ProductRegistration>(
      `/api/product-registrations/${id}/submit`,
    );
    return res.data;
  },

  async cancel(id: number): Promise<ProductRegistration> {
    const res = await api.post<ProductRegistration>(
      `/api/product-registrations/${id}/cancel`,
    );
    return res.data;
  },

  async startReview(id: number): Promise<ProductRegistration> {
    const res = await api.post<ProductRegistration>(
      `/api/product-registrations/${id}/review`,
    );
    return res.data;
  },

  async decide(
    id: number,
    decision: {
      decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
      reason?: string;
      expiresOn?: string;
    },
  ): Promise<ProductRegistration> {
    const res = await api.post<ProductRegistration>(
      `/api/product-registrations/${id}/decision`,
      decision,
    );
    return res.data;
  },
};

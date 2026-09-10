import { api } from "@/lib/api";

export type AnnouncementCategory =
  | "RELEASE"
  | "REGULATORY"
  | "INDUSTRY_NEWS"
  | "STANDARD";

export interface Announcement {
  id: number;
  title: string;
  excerpt: string;
  category: AnnouncementCategory;
  author: string;
  readTime: string | null;
  slug: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  /** Name of the organization that posted this; null = platform team (SAN TECH). */
  organizationName: string | null;
}

export interface CreateAnnouncementDto {
  title: string;
  excerpt: string;
  body?: string;
  category: AnnouncementCategory;
  author: string;
  readTime?: string;
  slug: string;
  published?: boolean;
}

export interface UpdateAnnouncementDto {
  title?: string;
  excerpt?: string;
  body?: string;
  category?: AnnouncementCategory;
  author?: string;
  readTime?: string;
  slug?: string;
}

export const announcementService = {
  /** Public: list published announcements. */
  list: (category?: AnnouncementCategory) =>
    api
      .get<Announcement[]>("/api/announcements", {
        params: category ? { category } : undefined,
      })
      .then((r) => r.data),

  /** Admin: list ALL announcements including drafts (requires PUBLISH_ANNOUNCEMENT). */
  listAll: () =>
    api.get<Announcement[]>("/api/announcements/admin").then((r) => r.data),

  /** Create a new announcement (requires PUBLISH_ANNOUNCEMENT). */
  create: (dto: CreateAnnouncementDto) =>
    api.post<Announcement>("/api/announcements", dto).then((r) => r.data),

  /** Update an existing announcement (requires PUBLISH_ANNOUNCEMENT). */
  update: (id: number, dto: UpdateAnnouncementDto) =>
    api.patch<Announcement>(`/api/announcements/${id}`, dto).then((r) => r.data),

  /** Publish an existing announcement (makes it live). */
  publish: (id: number) =>
    api.post<{ ok: boolean }>(`/api/announcements/${id}/publish`).then((r) => r.data),

  /** Retract a published announcement. */
  unpublish: (id: number) =>
    api.post<{ ok: boolean }>(`/api/announcements/${id}/unpublish`).then((r) => r.data),

  /** Permanently delete an announcement. */
  delete: (id: number) =>
    api.delete(`/api/announcements/${id}`).then((r) => r.data),
};

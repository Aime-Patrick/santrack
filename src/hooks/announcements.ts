"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  announcementService,
  type CreateAnnouncementDto,
  type UpdateAnnouncementDto,
} from "@/services/announcement.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

/** Invalidation key used by the public updates page too. */
export const announcementKeys = {
  all: ["announcements"] as const,
  admin: ["announcements", "admin"] as const,
};

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAnnouncementDto) => announcementService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success("Announcement created");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementService.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success("Announcement published");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUnpublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementService.unpublish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success("Announcement unpublished");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateAnnouncementDto }) =>
      announcementService.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success("Announcement updated");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success("Announcement deleted");
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

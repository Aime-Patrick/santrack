"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authKeys } from "@/hooks/auth";
import { authService } from "@/services/auth.service";
import { resolveAvatarSrc } from "@/lib/avatar-library";
import { cn } from "@/lib/utils";
import type { UserResponse } from "@/lib/api";

function initialsFor(user: Pick<UserResponse, "fullName" | "email">): string {
  return (user.fullName ?? user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/** Resolves a blob URL for an uploaded avatar (auth-required stream). */
function useUploadedAvatarSrc(enabled: boolean) {
  const query = useQuery({
    queryKey: [...authKeys.me, "avatar-blob"],
    queryFn: () => authService.fetchAvatarBlob(),
    enabled,
    staleTime: 5 * 60_000,
  });

  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(query.data);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [query.data]);

  return objectUrl;
}

type UserAvatarProps = {
  user: Pick<
    UserResponse,
    "fullName" | "email" | "avatarUrl" | "avatarUploaded"
  >;
  className?: string;
  fallbackClassName?: string;
};

/**
 * Shows local DiceBear library avatar, uploaded photo, or initials.
 */
export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const librarySrc = useMemo(
    () => resolveAvatarSrc(user.avatarUrl),
    [user.avatarUrl],
  );
  const uploadedSrc = useUploadedAvatarSrc(
    !!user.avatarUploaded && !librarySrc,
  );
  const src = librarySrc || uploadedSrc || undefined;
  const initials = initialsFor(user);

  return (
    <Avatar className={cn("rounded-xl", className)}>
      {src ? (
        <AvatarImage src={src} alt="" className="rounded-[inherit]" />
      ) : null}
      <AvatarFallback
        className={cn(
          "rounded-[inherit] bg-primary text-xs font-bold text-primary-foreground",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

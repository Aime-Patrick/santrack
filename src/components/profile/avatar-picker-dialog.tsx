"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/profile/user-avatar";
import {
  useClearAvatar,
  useSetLibraryAvatar,
  useUploadAvatar,
} from "@/hooks/auth";
import { getApiErrorMessage, type UserResponse } from "@/lib/api";
import {
  AVATAR_STYLES,
  LIBRARY_AVATARS,
  type AvatarStyle,
} from "@/lib/avatar-library";
import { cn } from "@/lib/utils";

type Props = {
  user: UserResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AvatarPickerDialog({ user, open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [style, setStyle] = useState<AvatarStyle>("notionists");
  const setLibrary = useSetLibraryAvatar();
  const upload = useUploadAvatar();
  const clear = useClearAvatar();
  const busy = setLibrary.isPending || upload.isPending || clear.isPending;

  const gallery = LIBRARY_AVATARS.filter((a) => a.style === style);

  function pickLibrary(url: string) {
    setLibrary.mutate(url, {
      onSuccess: () => {
        toast.success("Avatar updated");
        onOpenChange(false);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPEG, PNG, WebP, or GIF)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }
    upload.mutate(file, {
      onSuccess: () => {
        toast.success("Photo uploaded");
        onOpenChange(false);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  }

  function removeAvatar() {
    clear.mutate(undefined, {
      onSuccess: () => {
        toast.success("Avatar removed");
        onOpenChange(false);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Profile photo</DialogTitle>
          <DialogDescription>
            Pick an avatar from the library, or upload your own image.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center gap-4">
          <UserAvatar
            user={user}
            className="size-16 border-2 border-primary/20"
            fallbackClassName="text-lg"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImagePlus className="size-3.5" />
              )}
              Upload photo
            </Button>
            {(user.avatarUrl || user.avatarUploaded) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2 gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
                disabled={busy}
                onClick={removeAvatar}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )}
            <p className="text-[13px] text-muted-foreground">
              JPEG, PNG, WebP, or GIF · max 2 MB
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Avatar library
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  style === s
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            {gallery.map((avatar) => {
              const selected = user.avatarUrl === avatar.ref;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  disabled={busy}
                  title={avatar.seed}
                  onClick={() => pickLibrary(avatar.ref)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-xl border-2 bg-[#f0f7ff] transition-all hover:scale-[1.03]",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-border",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar.src}
                    alt={avatar.seed}
                    className="size-full object-cover"
                  />
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Avatars by{" "}
            <a
              href="https://www.dicebear.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              DiceBear
            </a>{" "}
            (bundled locally).
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export function AvatarEditButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      title="Change photo"
      aria-label="Change profile photo"
    >
      <Camera className="size-3.5" />
    </button>
  );
}

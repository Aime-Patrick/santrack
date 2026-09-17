"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Plus,
  Megaphone,
  Calendar,
  Globe,
  EyeOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPopup,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  announcementService,
  type Announcement,
  type AnnouncementCategory,
  type CreateAnnouncementDto,
  type UpdateAnnouncementDto,
} from "@/services/announcement.service";
import {
  useCreateAnnouncement,
  usePublishAnnouncement,
  useUnpublishAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from "@/hooks/announcements";

// ── helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  RELEASE: "Release",
  REGULATORY: "Regulatory",
  INDUSTRY_NEWS: "Industry News",
  STANDARD: "Standard",
};

const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  RELEASE: "bg-amber-100 text-amber-800 border-amber-200",
  REGULATORY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  STANDARD: "bg-blue-100 text-blue-800 border-blue-200",
  INDUSTRY_NEWS: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 150);
}

// ── New Announcement Dialog ───────────────────────────────────────────────────

interface NewAnnouncementDialogProps {
  onCreated: () => void;
}

function NewAnnouncementDialog({ onCreated }: NewAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const create = useCreateAnnouncement();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementDto>({
    defaultValues: { category: "RELEASE", published: false, body: "" },
  });

  const bodyValue = watch("body") ?? "";
  const titleValue = watch("title") ?? "";

  function onSubmit(data: CreateAnnouncementDto) {
    if (!data.slug) {
      data.slug = slugify(data.title);
    }
    create.mutate(data, {
      onSuccess: () => {
        reset();
        setOpen(false);
        onCreated();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-[#067eda] hover:bg-[#0569c0] text-white">
            <Plus className="size-4 mr-1.5" />
            New Announcement
          </Button>
        }
      />

      <DialogPopup className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Announcement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. GS1 Digital Link rollout — Phase 2"
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <Label>
              Excerpt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="A short summary shown on the updates page…"
              {...register("excerpt", { required: "Excerpt is required" })}
            />
            {errors.excerpt && (
              <p className="text-xs text-destructive">{errors.excerpt.message}</p>
            )}
          </div>

          {/* Category + Read time row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                defaultValue="RELEASE"
                onValueChange={(v) =>
                  v && setValue("category", v as AnnouncementCategory)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELEASE">Release</SelectItem>
                  <SelectItem value="REGULATORY">Regulatory</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="INDUSTRY_NEWS">Industry News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Read time</Label>
              <Input placeholder="e.g. 3 min read" {...register("readTime")} />
            </div>
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <Label>
              Author <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g. SAN TECH Team"
              {...register("author", { required: "Author is required" })}
            />
            {errors.author && (
              <p className="text-xs text-destructive">{errors.author.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              placeholder={slugify(titleValue) || "auto-generated-from-title"}
              {...register("slug")}
            />
            <p className="text-[13px] text-muted-foreground">
              Leave blank to generate automatically from the title.
            </p>
          </div>

          {/* Body — rich text editor */}
          <div className="space-y-1.5">
            <Label>Full body</Label>
            <RichTextEditor
              value={bodyValue}
              onChange={(html) => setValue("body", html)}
              placeholder="Optional — full article body…"
              minHeight={160}
            />
          </div>

          {/* Publish immediately toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="publish-now"
              type="checkbox"
              className="size-4 rounded border-border text-rwanda-blue focus:ring-rwanda-blue"
              {...register("published")}
            />
            <Label htmlFor="publish-now" className="cursor-pointer font-normal">
              Publish immediately (make live on the updates page)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              disabled={create.isPending}
              className="bg-[#067eda] hover:bg-[#0569c0] text-white"
            >
              {create.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Announcement"
              )}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

// ── Edit Announcement Dialog ──────────────────────────────────────────────────

interface EditAnnouncementDialogProps {
  post: Announcement;
  onUpdated: () => void;
}

function EditAnnouncementDialog({ post, onUpdated }: EditAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const update = useUpdateAnnouncement();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateAnnouncementDto>({
    defaultValues: {
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      readTime: post.readTime ?? "",
      slug: post.slug,
    },
  });

  const titleValue = watch("title") ?? "";

  function onOpen(next: boolean) {
    if (next) {
      reset({
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        author: post.author,
        readTime: post.readTime ?? "",
        slug: post.slug,
      });
    }
    setOpen(next);
  }

  function onSubmit(data: UpdateAnnouncementDto) {
    update.mutate(
      { id: post.id, dto: data },
      {
        onSuccess: () => {
          setOpen(false);
          onUpdated();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="text-xs">
            <Pencil className="size-3.5 mr-1" />
            Edit
          </Button>
        }
      />

      <DialogPopup className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Announcement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <Label>
              Excerpt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              rows={3}
              {...register("excerpt", { required: "Excerpt is required" })}
            />
            {errors.excerpt && (
              <p className="text-xs text-destructive">{errors.excerpt.message}</p>
            )}
          </div>

          {/* Category + Read time row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                defaultValue={post.category}
                onValueChange={(v) =>
                  v && setValue("category", v as AnnouncementCategory)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELEASE">Release</SelectItem>
                  <SelectItem value="REGULATORY">Regulatory</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="INDUSTRY_NEWS">Industry News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Read time</Label>
              <Input placeholder="e.g. 3 min read" {...register("readTime")} />
            </div>
          </div>

          {/* Author */}
          <div className="space-y-1.5">
            <Label>Author</Label>
            <Input {...register("author")} />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              placeholder={slugify(titleValue) || "auto-generated-from-title"}
              {...register("slug")}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              }
            />
            <Button
              type="submit"
              disabled={update.isPending}
              className="bg-[#067eda] hover:bg-[#0569c0] text-white"
            >
              {update.isPending ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  );
}

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────

interface DeleteAnnouncementDialogProps {
  post: Announcement;
  onDeleted: () => void;
}

function DeleteAnnouncementDialog({ post, onDeleted }: DeleteAnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const del = useDeleteAnnouncement();

  function handleDelete() {
    del.mutate(post.id, {
      onSuccess: () => {
        setOpen(false);
        onDeleted();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            <Trash2 className="size-3.5 mr-1" />
            Delete
          </Button>
        }
      />

      <DialogPopup className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete announcement?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2 mb-5">
          <strong className="text-foreground">&ldquo;{post.title}&rdquo;</strong> will
          be permanently removed. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Cancel
              </Button>
            }
          />
          <Button
            variant="destructive"
            disabled={del.isPending}
            onClick={handleDelete}
          >
            {del.isPending ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [page, setPage] = useState(1);
  const publish = usePublishAnnouncement();
  const unpublish = useUnpublishAnnouncement();

  // Admin list — includes drafts
  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ["announcements", "admin"],
    queryFn: () => announcementService.listAll(),
  });

  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePosts = posts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function onMutated() {
    refetch();
    setPage(1);
  }

  const draftCount = posts.filter((p) => !p.published).length;
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage public announcements shown on the Updates page.
          </p>
        </div>
        <NewAnnouncementDialog onCreated={onMutated} />
      </div>

      {/* ── Stats strip ── */}
      {!isLoading && posts.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5">
            <Megaphone className="size-3.5 text-[#067eda]" />
            <span>
              <strong className="text-foreground">{posts.length}</strong> total
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            <Globe className="size-3.5 text-green-600" />
            <span>
              <strong className="text-green-700">{publishedCount}</strong> published
            </span>
          </div>
          {draftCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <EyeOff className="size-3.5 text-amber-600" />
              <span>
                <strong className="text-amber-700">{draftCount}</strong> draft{draftCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <div className="py-16 flex justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Megaphone className="size-10 opacity-40" />
            <p className="text-sm font-medium">No announcements yet</p>
            <p className="text-xs">
              Create your first announcement using the button above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pagePosts.map((post) => (
            <Card
              key={post.id}
              className={`border-border/80 transition-colors ${
                !post.published ? "bg-muted/20 border-dashed" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[13px] ${CATEGORY_COLORS[post.category]}`}
                      >
                        {CATEGORY_LABELS[post.category]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          post.published
                            ? "text-[13px] bg-green-50 text-green-700 border-green-200"
                            : "text-[13px] bg-amber-50 text-amber-600 border-amber-200"
                        }
                      >
                        {post.published ? (
                          <>
                            <Globe className="size-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold leading-snug">
                      {post.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <EditAnnouncementDialog post={post} onUpdated={onMutated} />

                    {post.published ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={unpublish.isPending}
                        onClick={() =>
                          unpublish.mutate(post.id, { onSuccess: onMutated })
                        }
                      >
                        <EyeOff className="size-3.5 mr-1" />
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="text-xs bg-[#067eda] hover:bg-[#0569c0] text-white"
                        disabled={publish.isPending}
                        onClick={() =>
                          publish.mutate(post.id, { onSuccess: onMutated })
                        }
                      >
                        <Globe className="size-3.5 mr-1" />
                        Publish
                      </Button>
                    )}

                    <DeleteAnnouncementDialog post={post} onDeleted={onMutated} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {post.published
                      ? formatDate(post.publishedAt)
                      : `Created ${formatDate(post.createdAt)}`}
                  </span>
                  <span>
                    By{" "}
                    <span className="font-medium text-foreground">
                      {post.organizationName ?? post.author}
                    </span>
                  </span>
                  {post.readTime && <span>{post.readTime}</span>}
                  <span className="font-mono text-[13px] text-slate-400">
                    /{post.slug}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages} &middot; {posts.length} announcement
            {posts.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  p === safePage
                    ? "bg-[#067eda] text-white"
                    : "border border-border/70 text-muted-foreground hover:bg-muted"
                }`}
                aria-current={p === safePage ? "page" : undefined}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

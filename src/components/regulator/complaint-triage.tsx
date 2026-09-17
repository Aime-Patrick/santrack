"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, LoaderCircle, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDismissComplaint, usePromoteComplaint, useRegulatoryComplaints } from "@/hooks/regulatory-complaints";
import {
  useConfigureMyRegulatoryAuthority,
  useMyRegulatoryAuthority,
} from "@/hooks/regulatory-authorities";
import { regulatoryComplaintService } from "@/services/regulatory-complaint.service";
import { getApiErrorMessage } from "@/lib/api";
import { INTEL_PAGE_SIZE, QueuePagination, QueueSearch } from "@/components/regulator/queue-toolbar";

const label = (value: string) => value.replaceAll("_", " ").toLowerCase();
const CREATE_NEW = "__create__";

export function ComplaintTriage() {
  const { data: complaints = [], isLoading } = useRegulatoryComplaints();
  const { data: authority } = useMyRegulatoryAuthority(true);
  const configure = useConfigureMyRegulatoryAuthority();
  const promote = usePromoteComplaint();
  const dismiss = useDismissComplaint();
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [draftNames, setDraftNames] = useState<Record<number, string>>({});
  const [photoFor, setPhotoFor] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pending = promote.isPending || dismiss.isPending || configure.isPending;
  const caseCategories = authority?.caseCategories ?? [];
  const hasCategories = caseCategories.length > 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter((complaint) => {
      const haystack = [
        complaint.issue,
        complaint.note ?? "",
        complaint.locationHint ?? "",
        complaint.batch?.batchCode ?? "",
        complaint.item?.code ?? "",
        `rpt-${String(complaint.id).padStart(6, "0")}`,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [complaints, query]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / INTEL_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * INTEL_PAGE_SIZE, safePage * INTEL_PAGE_SIZE + INTEL_PAGE_SIZE);

  async function ensureCategory(name: string): Promise<string | null> {
    if (!authority) {
      toast.error("Authority workspace is not configured yet");
      return null;
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Enter a category name (at least 2 characters)");
      return null;
    }
    if (caseCategories.includes(trimmed)) return trimmed;

    try {
      await configure.mutateAsync({
        mandates: authority.mandates,
        caseCategories: [...caseCategories, trimmed],
        teams: authority.teams,
        referralResponseDays: authority.referralResponseDays,
      });
      toast.success(`Category “${trimmed}” added`);
      return trimmed;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save category"));
      return null;
    }
  }

  async function openCase(complaintId: number, batchOk: boolean) {
    if (!batchOk) {
      toast.error("This report has no batch to investigate");
      return;
    }
    const selected = categories[complaintId] ?? "";
    const categoryName =
      selected === CREATE_NEW
        ? (draftNames[complaintId] ?? "").trim()
        : selected.trim();

    if (!categoryName) {
      toast.error(hasCategories ? "Choose a case category" : "Create a case category first");
      return;
    }

    const saved = await ensureCategory(categoryName);
    if (!saved) return;

    setCategories((prev) => ({ ...prev, [complaintId]: saved }));
    promote.mutate(
      { id: complaintId, caseCategory: saved },
      {
        onSuccess: () => toast.success("Case opened from market report"),
        onError: (error) => toast.error(getApiErrorMessage(error, "Could not open case")),
      },
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Market signals</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Unverified public reports. Review before they become regulatory work.
          </p>
        </div>
        <Badge variant="outline">{filtered.length} to triage</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No public reports need review.
          </div>
        ) : (
          <>
            {!hasCategories && (
              <div className="border-b border-warning/30 bg-warning/5 px-5 py-3 text-xs text-warning-foreground">
                No case categories yet. Create one on a row below, or manage the full list in{" "}
                <Link href="/dashboard/regulator?tab=setup" className="font-medium underline">
                  Setup
                </Link>
                .
              </div>
            )}
            <QueueSearch
              query={query}
              onQuery={setQuery}
              placeholder="Search issue, batch, location, or report number…"
            />
            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No reports match that search.
              </p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead>Issue</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Location · Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((complaint) => {
                  const selected = categories[complaint.id] ?? (hasCategories ? "" : CREATE_NEW);
                  const creating = selected === CREATE_NEW || !hasCategories;

                  return (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium capitalize">{label(complaint.issue)}</p>
                            {complaint.note && (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {complaint.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">
                          RPT-{String(complaint.id).padStart(6, "0")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {complaint.batch ? (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {complaint.batch.batchCode}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">
                          {complaint.locationHint || "No area supplied"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(complaint.receivedAt).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {complaint.photoName && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setPhotoFor(complaint.id)}
                              >
                                Photo
                              </Button>
                            )}
                            {hasCategories ? (
                              <select
                                className="h-7 max-w-[160px] rounded-md border border-input bg-background px-2 text-xs"
                                value={selected}
                                onChange={(e) =>
                                  setCategories((prev) => ({
                                    ...prev,
                                    [complaint.id]: e.target.value,
                                  }))
                                }
                              >
                                <option value="">Category…</option>
                                {caseCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                                <option value={CREATE_NEW}>+ Create category…</option>
                              </select>
                            ) : null}
                            {creating && (
                              <Input
                                className="h-7 w-[140px] text-xs"
                                placeholder="e.g. RECALL"
                                value={draftNames[complaint.id] ?? ""}
                                onChange={(e) =>
                                  setDraftNames((prev) => ({
                                    ...prev,
                                    [complaint.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    void openCase(complaint.id, !!complaint.batch);
                                  }
                                }}
                              />
                            )}
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={pending || !complaint.batch}
                              onClick={() => void openCase(complaint.id, !!complaint.batch)}
                            >
                              {creating ? (
                                <Plus className="mr-1 size-3" />
                              ) : (
                                <CheckCircle2 className="mr-1 size-3" />
                              )}
                              {creating ? "Create & open" : "Open case"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={pending}
                              onClick={() => dismiss.mutate(complaint.id)}
                            >
                              <X className="mr-1 size-3" />
                              Dismiss
                            </Button>
                          </div>
                          {!hasCategories && (
                            <p className="text-[13px] text-muted-foreground">
                              Type a category name, then Create &amp; open — it is saved for next time.
                            </p>
                          )}
                        </div>
                        {photoFor === complaint.id && (
                          <ComplaintPhoto
                            complaintId={complaint.id}
                            onClose={() => setPhotoFor(null)}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
            <QueuePagination
              total={filtered.length}
              page={safePage}
              pageSize={INTEL_PAGE_SIZE}
              onPage={setPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ComplaintPhoto({ complaintId, onClose }: { complaintId: number; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    regulatoryComplaintService
      .photoUrl(complaintId)
      .then((value) => {
        objectUrl = value;
        if (active) setUrl(value);
        else URL.revokeObjectURL(value);
      })
      .catch(() => setError(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [complaintId]);

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-2 flex justify-between gap-2">
        <p className="text-sm font-medium">Submitted photo</p>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-danger">Could not load this photo.</p>
      ) : url ? (
        <img
          src={url}
          alt="Submitted public report evidence"
          className="max-h-80 w-full rounded-md object-contain"
        />
      ) : (
        <div className="flex justify-center py-8">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDismissComplaint, usePromoteComplaint, useRegulatoryComplaints } from "@/hooks/regulatory-complaints";
import { useMyRegulatoryAuthority } from "@/hooks/regulatory-authorities";
import { regulatoryComplaintService } from "@/services/regulatory-complaint.service";

const label = (value: string) => value.replaceAll("_", " ").toLowerCase();

export function ComplaintTriage() {
  const { data: complaints = [], isLoading } = useRegulatoryComplaints();
  const { data: authority } = useMyRegulatoryAuthority(true);
  const promote = usePromoteComplaint();
  const dismiss = useDismissComplaint();
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [photoFor, setPhotoFor] = useState<number | null>(null);
  const pending = promote.isPending || dismiss.isPending;

  return <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4"><div><CardTitle className="text-base">Market signals</CardTitle><p className="mt-1 text-sm text-muted-foreground">Unverified public reports. Review before they become regulatory work.</p></div><Badge variant="outline">{complaints.length} to triage</Badge></CardHeader><CardContent className="p-0">
    {isLoading ? <div className="flex justify-center py-10"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div> : complaints.length === 0 ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">No public reports need review.</div> : <div className="divide-y divide-border/70">{complaints.slice(0, 8).map((complaint) => <div key={complaint.id} className="p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{label(complaint.issue)}</p><Badge variant="secondary" className="font-mono">RPT-{String(complaint.id).padStart(6, "0")}</Badge>{complaint.batch && <Badge variant="outline" className="font-mono">{complaint.batch.batchCode}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{complaint.note || "No description supplied."}</p><p className="mt-1 text-xs text-muted-foreground">{complaint.locationHint || "No area supplied"} · {new Date(complaint.receivedAt).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2">{complaint.photoName && <Button variant="outline" size="sm" onClick={() => setPhotoFor(complaint.id)}>View photo</Button>}<select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={categories[complaint.id] ?? ""} onChange={(event) => setCategories((current) => ({ ...current, [complaint.id]: event.target.value }))}><option value="">Choose case category</option>{authority?.caseCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select><Button size="sm" disabled={pending || !complaint.batch || !categories[complaint.id]} onClick={() => promote.mutate({ id: complaint.id, caseCategory: categories[complaint.id] })}><CheckCircle2 className="mr-1.5 size-4" /> Open case</Button><Button variant="ghost" size="sm" disabled={pending} onClick={() => dismiss.mutate(complaint.id)}><X className="mr-1.5 size-4" /> Dismiss</Button></div>{authority && authority.caseCategories.length === 0 ? <p className="mt-2 text-xs text-warning-foreground">Configure case categories in Authority Setup before opening cases.</p> : null}{photoFor === complaint.id && <ComplaintPhoto complaintId={complaint.id} onClose={() => setPhotoFor(null)} />}</div></div></div>)}</div>}
  </CardContent></Card>;
}

function ComplaintPhoto({ complaintId, onClose }: { complaintId: number; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null); const [error, setError] = useState(false);
  useEffect(() => { let active = true; let objectUrl: string | null = null; regulatoryComplaintService.photoUrl(complaintId).then((value) => { objectUrl = value; if (active) setUrl(value); else URL.revokeObjectURL(value); }).catch(() => setError(true)); return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [complaintId]);
  return <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3"><div className="mb-2 flex justify-between gap-2"><p className="text-sm font-medium">Submitted photo</p><Button size="sm" variant="ghost" onClick={onClose}>Close</Button></div>{error ? <p className="text-sm text-danger">Could not load this photo.</p> : url ? <img src={url} alt="Submitted public report evidence" className="max-h-80 w-full rounded-md object-contain" /> : <div className="flex justify-center py-8"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>}</div>;
}

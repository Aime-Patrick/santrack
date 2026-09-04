"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfigureMyRegulatoryAuthority, useMyRegulatoryAuthority } from "@/hooks/regulatory-authorities";

const split = (value: string) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];

export function AuthoritySelfSetup() {
  const { data, isLoading } = useMyRegulatoryAuthority(true);
  const save = useConfigureMyRegulatoryAuthority();
  const [mandates, setMandates] = useState("");
  const [categories, setCategories] = useState("");
  const [teams, setTeams] = useState("");
  const [referralDays, setReferralDays] = useState("");

  useEffect(() => { if (data) { setMandates(data.mandates.join(", ")); setCategories(data.caseCategories.join(", ")); setTeams(data.teams.join(", ")); setReferralDays(data.referralResponseDays ? String(data.referralResponseDays) : ""); } }, [data]);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading authority setup…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Your authority workspace has not been onboarded yet.</p>;

  return <Card>
    <CardHeader><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white"><ShieldCheck className="size-4" /></div><div><CardTitle>{data.name}</CardTitle><CardDescription>Only your authority controls these operational settings.</CardDescription></div></div></CardHeader>
    <CardContent className="space-y-4">
      <Field label="Mandates" value={mandates} onChange={setMandates} placeholder="Product compliance, consumer protection" />
      <Field label="Case categories" value={categories} onChange={setCategories} placeholder="Suspected counterfeit, unsafe product" />
      <Field label="Teams" value={teams} onChange={setTeams} placeholder="Market surveillance, case triage" />
      <div className="space-y-2"><Label>Referral response target (days)</Label><Input type="number" min={1} max={365} value={referralDays} onChange={(event) => setReferralDays(event.target.value)} placeholder="Optional — no alert until set" /></div>
      <p className="text-xs text-muted-foreground">Separate entries with commas. These settings do not assign cases or expose another authority’s work.</p>
      <Button onClick={() => save.mutate({ mandates: split(mandates), caseCategories: split(categories), teams: split(teams), referralResponseDays: referralDays ? Number(referralDays) : null })} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save authority setup"}</Button>
    </CardContent>
  </Card>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>;
}

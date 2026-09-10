"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useConfigureMyRegulatoryAuthority, useMyRegulatoryAuthority } from "@/hooks/regulatory-authorities";

// ── All sector values that can be assigned as mandates ────────────────────────

const SECTOR_OPTIONS: { value: string; label: string }[] = [
  { value: "FOOD_AND_BEVERAGE",       label: "Food & Beverage"       },
  { value: "PHARMACEUTICALS",         label: "Pharmaceuticals"        },
  { value: "COSMETICS",               label: "Cosmetics"              },
  { value: "MINING_AND_MINERALS",     label: "Mining & Minerals"      },
  { value: "AGRICULTURE_AND_EXPORTS", label: "Agriculture & Exports"  },
  { value: "GENERAL_MANUFACTURING",   label: "General Manufacturing"  },
  { value: "DISTRIBUTION",            label: "Distribution"           },
  { value: "RETAIL",                  label: "Retail"                 },
  { value: "OTHER",                   label: "Other"                  },
];

const split = (value: string) =>
  [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];

export function AuthoritySelfSetup() {
  const { data, isLoading } = useMyRegulatoryAuthority(true);
  const save = useConfigureMyRegulatoryAuthority();

  // Sector mandates as a Set of toggled values
  const [mandates, setMandates] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState("");
  const [teams, setTeams] = useState("");
  const [referralDays, setReferralDays] = useState("");

  // Seed form from API exactly once per mount
  const [seeded, setSeeded] = useState(false);
  if (data && !seeded) {
    setSeeded(true);
    setMandates(new Set(data.mandates));
    setCategories(data.caseCategories.join(", "));
    setTeams(data.teams.join(", "));
    setReferralDays(data.referralResponseDays ? String(data.referralResponseDays) : "");
  }

  function toggleSector(value: string) {
    setMandates((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading authority setup…</p>;
  if (!data) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Authority workspace not configured</p>
          <p className="mt-1 text-xs text-amber-700 leading-relaxed">
            Your organization is registered as a regulator but has not been linked to a SANTRACK
            authority workspace. Ask the <strong>System Administrator</strong> to open the{" "}
            <strong>Regulators</strong> screen and onboard your organization as an authority.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <CardTitle>{data.name}</CardTitle>
            <CardDescription>Only your authority controls these operational settings.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* ── Sector mandates — tag selector ── */}
        <div className="space-y-2">
          <Label>
            Industry sector mandates
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              — determines which applications are routed here
            </span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {SECTOR_OPTIONS.map(({ value, label }) => {
              const active = mandates.has(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSector(value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {label}
                  {active && <X className="size-3 shrink-0" />}
                </button>
              );
            })}
          </div>
          {mandates.size === 0 && (
            <p className="text-[11px] text-muted-foreground">
              No sectors selected — new applications will not be routed here automatically.
            </p>
          )}
        </div>

        {/* ── Case categories ── */}
        <Field
          label="Case categories"
          value={categories}
          onChange={setCategories}
          placeholder="Suspected counterfeit, unsafe product"
        />

        {/* ── Teams ── */}
        <Field
          label="Teams"
          value={teams}
          onChange={setTeams}
          placeholder="Market surveillance, case triage"
        />

        {/* ── Referral response target ── */}
        <div className="space-y-2">
          <Label>Referral response target (days)</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={referralDays}
            onChange={(e) => setReferralDays(e.target.value)}
            placeholder="Optional — no alert until set"
            className="max-w-[200px]"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Case categories and teams: separate entries with commas. These settings do not assign cases or expose another authority's work.
        </p>

        <Button
          onClick={() =>
            save.mutate({
              mandates: [...mandates],
              caseCategories: split(categories),
              teams: split(teams),
              referralResponseDays: referralDays ? Number(referralDays) : null,
            })
          }
          disabled={save.isPending}
        >
          {save.isPending ? "Saving…" : "Save authority setup"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

"use client";

import * as React from "react";
import {
  GripVertical,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SectionRow {
  id: string;
  header: string;
  sectionType: string;
  status: "Done" | "In Process";
  target: number;
  limit: number;
  reviewer: string;
}

const initialRows: SectionRow[] = [
  {
    id: "1",
    header: "Cover page",
    sectionType: "Cover page",
    status: "In Process",
    target: 18,
    limit: 5,
    reviewer: "Eddie Lake",
  },
  {
    id: "2",
    header: "Table of contents",
    sectionType: "Table of contents",
    status: "Done",
    target: 29,
    limit: 24,
    reviewer: "Eddie Lake",
  },
  {
    id: "3",
    header: "Executive summary",
    sectionType: "Narrative",
    status: "Done",
    target: 10,
    limit: 13,
    reviewer: "Eddie Lake",
  },
  {
    id: "4",
    header: "Technical approach",
    sectionType: "Narrative",
    status: "Done",
    target: 27,
    limit: 23,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "5",
    header: "Design",
    sectionType: "Narrative",
    status: "In Process",
    target: 2,
    limit: 16,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "6",
    header: "Capabilities",
    sectionType: "Narrative",
    status: "In Process",
    target: 20,
    limit: 8,
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: "7",
    header: "Integration with existing systems",
    sectionType: "Narrative",
    status: "In Process",
    target: 19,
    limit: 21,
    reviewer: "Jamik Tashpulatov",
  },
];

export function OutlineTable() {
  const [activeTab, setActiveTab] = React.useState("outline");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const tabs = [
    { key: "outline", label: "Outline" },
    { key: "past-performance", label: "Past Performance", count: 3 },
    { key: "key-personnel", label: "Key Personnel", count: 2 },
    { key: "focus-documents", label: "Focus Documents" },
  ];

  const toggleSelectAll = () => {
    if (selectedIds.length === initialRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialRows.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      {/* ── Tabs & Actions Header ── */}
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-border/60 p-4 pb-0">
        {/* Left Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative pb-3 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5",
                activeTab === tab.key
                  ? "text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2 pb-3 md:pb-3">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <span>Customize Columns</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Add Section</span>
          </button>
        </div>
      </CardHeader>

      {/* ── Table Content ── */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-medium">
                <th className="w-10 px-3 py-2.5 text-center">
                  <span className="sr-only">Drag</span>
                </th>
                <th className="w-8 px-2 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === initialRows.length}
                    onChange={toggleSelectAll}
                    className="size-3.5 rounded border-border text-foreground accent-foreground cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground">Header</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground">Section Type</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground text-center">Target</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground text-center">Limit</th>
                <th className="px-3 py-2.5 font-semibold text-muted-foreground">Reviewer</th>
                <th className="w-8 px-3 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {initialRows.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "group hover:bg-muted/30 transition-colors",
                      isSelected && "bg-muted/40"
                    )}
                  >
                    <td className="px-3 py-3 text-center text-muted-foreground/40 group-hover:text-muted-foreground transition-colors cursor-grab">
                      <GripVertical className="size-3.5 mx-auto" />
                    </td>
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="size-3.5 rounded border-border text-foreground accent-foreground cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">{row.header}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {row.sectionType}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {row.status === "Done" ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <span className="size-2 rounded-full border border-amber-500 bg-amber-100 dark:bg-amber-950" />
                          In Process
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-foreground">{row.target}</td>
                    <td className="px-3 py-3 text-center font-medium text-foreground">{row.limit}</td>
                    <td className="px-3 py-3 text-foreground">{row.reviewer}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        className="flex size-6 items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

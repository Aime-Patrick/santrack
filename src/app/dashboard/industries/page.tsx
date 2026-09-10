"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Building2,
  MoreHorizontal,
  Eye,
  Pencil,
  ShieldCheck,
  Search,
  Filter,
  X,
  MapPin,
  Package,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Factory,
  FileBadge,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { TableFeatures } from "@/components/ui/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIndustryRegistry } from "@/hooks/organizations";
import { useCapabilities } from "@/hooks/permissions";
import { useMe } from "@/hooks/auth";
import { IndustryEditDialog } from "./edit-dialog";
import type { OrganizationResponse } from "@/lib/api";
import type { RegistryLicense } from "@/services/organization.service";
import { Provinces } from "rwanda";

type Industry = {
  id: string;
  name: string;
  category: string;
  type: string;
  status: "active" | "pending" | "inactive";
  orgId: number;
  tin: string | null;
  registrationNumber: string | null;
  province: string | null;
  district: string | null;
  sector: string | null;
  industrySector: string | null;
  staff: number;
  products: number;
  facilities: number;
  licensedByUs: boolean;
  licensingAuthorityName: string | null;
  primaryLicenseNumber: string | null;
  primaryLicenseActivity: string | null;
  licenseExpiresOn: string | null;
  licenses: RegistryLicense[];
};

function licenceStanding(licenses: RegistryLicense[]): Industry["status"] {
  if (licenses.some((l) => l.status === "ACTIVE" || l.status === "APPROVED")) return "active";
  if (licenses.some((l) => l.status === "SUBMITTED" || l.status === "UNDER_REVIEW")) return "pending";
  return "inactive";
}

const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
  REGULATOR: "Regulator",
  CONSUMER: "Consumer",
};

const TYPE_COLORS: Record<string, string> = {
  MANUFACTURER: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  WAREHOUSE: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  DISTRIBUTOR: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  RETAILER: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SHOP: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

function StatusBadge({ status }: { status: Industry["status"] }) {
  if (status === "active") {
    return (
      <Badge className="border-emerald-600/30 bg-emerald-500/10 text-emerald-700 font-semibold dark:text-emerald-400">
        <CheckCircle2 className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" /> Active
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge className="border-amber-600/30 bg-amber-500/10 text-amber-700 font-semibold dark:text-amber-400">
        <Clock className="mr-1 size-3 text-amber-600 dark:text-amber-400" /> Pending Review
      </Badge>
    );
  }
  return (
    <Badge className="border-slate-400/30 bg-muted text-muted-foreground font-medium">
      Unlicensed
    </Badge>
  );
}

function IndustriesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permissions = useCapabilities();
  const { data: me } = useMe();
  const mayManage = permissions.can("MANAGE_INDUSTRIES");

  const { data: orgs, isLoading } = useIndustryRegistry();
  const [editOrg, setEditOrg] = useState<OrganizationResponse | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  // Filters from query param or local state
  const initialScope = searchParams.get("scope") || "all";
  const [scopeFilter, setScopeFilter] = useState<string>(initialScope);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [provinceFilter, setProvinceFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const myOrgId = me?.organization?.id;
  const isRegulator = me?.organization?.type === "REGULATOR";

  const rwandaProvinces = useMemo(() => {
    try {
      return Provinces() ?? [];
    } catch {
      return [];
    }
  }, []);

  const industries: Industry[] = useMemo(() => {
    return (
      orgs?.map((org) => {
        const licenses = (org.licenses as RegistryLicense[]) ?? [];
        const activeLicense = licenses.find(
          (l) => l.status === "ACTIVE" || l.status === "APPROVED",
        );
        const myLicense = licenses.find(
          (l) =>
            myOrgId &&
            l.issuedByOrgId === myOrgId &&
            (l.status === "ACTIVE" || l.status === "APPROVED"),
        );

        return {
          id: `ORG-${String(org.id).padStart(3, "0")}`,
          name: org.name,
          category: TYPE_LABELS[org.type] ?? org.type,
          type: org.type,
          status: licenceStanding(licenses),
          orgId: org.id,
          tin: org.tin ?? null,
          registrationNumber: org.registrationNumber ?? null,
          province: org.province ?? null,
          district: org.district ?? null,
          sector: org.sector ?? null,
          industrySector: org.industrySector ?? null,
          staff: org.staff ?? 0,
          products: org.products ?? 0,
          facilities: org.facilities ?? 0,
          licensedByUs: Boolean(myLicense),
          licensingAuthorityName:
            myLicense?.issuedByOrgName || activeLicense?.issuedByOrgName || null,
          primaryLicenseNumber:
            myLicense?.licenseNumber || activeLicense?.licenseNumber || null,
          primaryLicenseActivity:
            myLicense?.activity || activeLicense?.activity || null,
          licenseExpiresOn:
            myLicense?.expiresOn || activeLicense?.expiresOn || null,
          licenses,
        };
      }) ?? []
    );
  }, [orgs, myOrgId]);

  // Counts for scopes
  const counts = useMemo(() => {
    const total = industries.length;
    const licensedByUs = industries.filter((i) => i.licensedByUs).length;
    const active = industries.filter((i) => i.status === "active").length;
    const pending = industries.filter((i) => i.status === "pending").length;
    const unlicensed = industries.filter((i) => i.status === "inactive").length;
    return { total, licensedByUs, active, pending, unlicensed };
  }, [industries]);

  // Filtered dataset
  const filteredIndustries = useMemo(() => {
    return industries.filter((item) => {
      // Scope Filter
      if (scopeFilter === "licensed_by_us" && !item.licensedByUs) return false;
      if (scopeFilter === "active" && item.status !== "active") return false;
      if (scopeFilter === "pending" && item.status !== "pending") return false;
      if (scopeFilter === "unlicensed" && item.status !== "inactive") return false;

      // Type Filter
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;

      // Province Filter
      if (provinceFilter !== "ALL" && item.province !== provinceFilter) return false;

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesTin = item.tin ? item.tin.toLowerCase().includes(q) : false;
        const matchesDistrict = item.district ? item.district.toLowerCase().includes(q) : false;
        const matchesLicense = item.primaryLicenseNumber
          ? item.primaryLicenseNumber.toLowerCase().includes(q)
          : false;
        if (!matchesName && !matchesId && !matchesTin && !matchesDistrict && !matchesLicense) {
          return false;
        }
      }

      return true;
    });
  }, [industries, scopeFilter, typeFilter, provinceFilter, searchQuery]);

  const hasActiveFilters =
    scopeFilter !== "all" ||
    typeFilter !== "ALL" ||
    provinceFilter !== "ALL" ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setScopeFilter("all");
    setTypeFilter("ALL");
    setProvinceFilter("ALL");
    setSearchQuery("");
  };

  const columns: ColumnDef<TableFeatures, Industry>[] = [
    {
      accessorKey: "name",
      header: "Industry / Business",
      cell: ({ row }) => {
        const industry = row.original;
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar className="size-9 ring-1 ring-border/50">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {industry.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/dashboard/industries/${industry.orgId}`}
                className="font-semibold hover:underline text-foreground tracking-tight"
              >
                {industry.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                <span>{industry.id}</span>
                {industry.tin && (
                  <>
                    <span>·</span>
                    <span className="font-mono text-[11px] bg-muted px-1 rounded text-foreground">
                      TIN {industry.tin}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category & Trade",
      cell: ({ row }) => {
        const ind = row.original;
        const colorClass = TYPE_COLORS[ind.type] || "bg-muted text-muted-foreground";
        return (
          <div className="space-y-1">
            <Badge className={`border px-2 py-0.5 text-xs font-medium ${colorClass}`}>
              {ind.category}
            </Badge>
            {ind.industrySector && (
              <p className="text-[11px] text-muted-foreground capitalize">
                {ind.industrySector.replace(/_/g, " ").toLowerCase()}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const ind = row.original;
        return (
          <div className="text-xs">
            {ind.district || ind.province ? (
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="size-3 text-muted-foreground shrink-0" />
                <span>
                  {ind.district ? ind.district : ""}
                  {ind.district && ind.province ? ", " : ""}
                  {ind.province ? ind.province : ""}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Rwanda national</span>
            )}
            {ind.sector && (
              <p className="text-[11px] text-muted-foreground pl-4.5">{ind.sector} Sector</p>
            )}
          </div>
        );
      },
    },
    {
      id: "scale",
      header: "Scale & Capacity",
      cell: ({ row }) => {
        const ind = row.original;
        return (
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <span>
                <strong className="text-foreground">{ind.staff}</strong> staff
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="size-3" />
              <span>
                <strong className="text-foreground">{ind.products}</strong> products
              </span>
              {ind.facilities > 0 && (
                <>
                  <span>·</span>
                  <span>
                    <strong className="text-foreground">{ind.facilities}</strong> sites
                  </span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Licence & Standing",
      cell: ({ row }) => {
        const ind = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <StatusBadge status={ind.status} />
              {ind.licensedByUs && (
                <Badge className="border-blue-600/30 bg-blue-500/10 text-blue-700 text-[10px] font-semibold dark:text-blue-400">
                  <ShieldCheck className="mr-1 size-3 text-blue-600 dark:text-blue-400" />
                  Licensed by Us
                </Badge>
              )}
            </div>
            {ind.primaryLicenseNumber && (
              <div className="text-[11px] text-muted-foreground">
                <span className="font-mono text-foreground">{ind.primaryLicenseNumber}</span>
                {ind.licenseExpiresOn && (
                  <span className="ml-1">
                    · Exp: {new Date(ind.licenseExpiresOn).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const industry = row.original;
        const org = orgs?.find((o) => o.id === industry.orgId);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/dashboard/industries/${industry.orgId}`)}>
                <Eye className="mr-2 size-4 text-primary" /> View 360° Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/manufacturing/trace`)}>
                <Factory className="mr-2 size-4 text-muted-foreground" /> Trace & Audit
              </DropdownMenuItem>
              {mayManage && (
                <DropdownMenuItem
                  onClick={() => {
                    setEditOrg(org ?? null);
                    setShowEdit(true);
                  }}
                >
                  <Pencil className="mr-2 size-4 text-muted-foreground" /> Edit Info
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warning-foreground text-white shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Industry Registry</h1>
            <p className="text-xs text-muted-foreground">
              National registry of registered businesses, operating permits, site premises & regulatory standing
            </p>
          </div>
        </div>
        {mayManage && (
          <Link href="/dashboard/industries/new">
            <Button className="shadow-sm">
              <Plus className="mr-2 size-4" /> Add Industry
            </Button>
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all hover:border-primary/50 ${
            scopeFilter === "all" ? "ring-2 ring-primary/40 bg-primary/5" : ""
          }`}
          onClick={() => setScopeFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Registered</span>
              <Building2 className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{counts.total}</p>
            <p className="text-[11px] text-muted-foreground">All businesses</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-blue-500/50 ${
            scopeFilter === "licensed_by_us" ? "ring-2 ring-blue-500/40 bg-blue-500/5" : ""
          }`}
          onClick={() => setScopeFilter("licensed_by_us")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Licensed by Us</span>
              <ShieldCheck className="size-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400 tracking-tight">
              {counts.licensedByUs}
            </p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">Direct authority oversight</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-emerald-500/50 ${
            scopeFilter === "active" ? "ring-2 ring-emerald-500/40 bg-emerald-500/5" : ""
          }`}
          onClick={() => setScopeFilter("active")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Permits</span>
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
              {counts.active}
            </p>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Valid operating standing</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:border-amber-500/50 ${
            scopeFilter === "pending" ? "ring-2 ring-amber-500/40 bg-amber-500/5" : ""
          }`}
          onClick={() => setScopeFilter("pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Pending Review</span>
              <Clock className="size-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400 tracking-tight">
              {counts.pending}
            </p>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">Applications in queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Scope Filter Pills & Search Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Scope Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant={scopeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("all")}
              className="h-8 text-xs font-medium"
            >
              All Industries ({counts.total})
            </Button>
            <Button
              variant={scopeFilter === "licensed_by_us" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("licensed_by_us")}
              className="h-8 text-xs font-medium"
            >
              <ShieldCheck className="mr-1 size-3.5" />
              Licensed by Us ({counts.licensedByUs})
            </Button>
            <Button
              variant={scopeFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("active")}
              className="h-8 text-xs font-medium"
            >
              Active ({counts.active})
            </Button>
            <Button
              variant={scopeFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("pending")}
              className="h-8 text-xs font-medium"
            >
              Pending ({counts.pending})
            </Button>
            <Button
              variant={scopeFilter === "unlicensed" ? "default" : "outline"}
              size="sm"
              onClick={() => setScopeFilter("unlicensed")}
              className="h-8 text-xs font-medium"
            >
              Unlicensed ({counts.unlicensed})
            </Button>
          </div>

          {/* Quick Active Filters Reset */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 size-3.5" /> Clear Filters
            </Button>
          )}
        </div>

        {/* Detailed Filter Bar */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, TIN, ORG ID, district, or license #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs"
            />
          </div>

          <div>
            <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "ALL")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="MANUFACTURER">Manufacturing</SelectItem>
                <SelectItem value="DISTRIBUTOR">Distribution</SelectItem>
                <SelectItem value="RETAILER">Retail</SelectItem>
                <SelectItem value="WAREHOUSE">Warehousing</SelectItem>
                <SelectItem value="SHOP">Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={provinceFilter}
              onValueChange={(val) => setProvinceFilter(val || "ALL")}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Provinces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Provinces</SelectItem>
                {rwandaProvinces.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-32 rounded bg-muted" />
                      <div className="h-2 w-16 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredIndustries}
              pageSize={10}
              showPagination={true}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <IndustryEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        organization={editOrg}
      />
    </div>
  );
}

/**
 * useSearchParams needs a Suspense boundary above it in Next.js.
 */
export default function IndustriesPage() {
  return (
    <Suspense fallback={null}>
      <IndustriesWorkspace />
    </Suspense>
  );
}

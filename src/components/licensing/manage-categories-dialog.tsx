"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllLicenseCategories,
  useCreateLicenseCategory,
  useUpdateLicenseCategory,
  useDeleteLicenseCategory,
} from "@/hooks/licensing";
import {
  getApiErrorMessage,
  type LicenseCategory,
  type LicensedActivity,
  type OrganizationType,
} from "@/lib/api";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  Building,
  LoaderCircle,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_ACTIVITIES: { value: LicensedActivity; label: string }[] = [
  { value: "MANUFACTURING", label: "Manufacturing" },
  { value: "WAREHOUSING", label: "Warehousing" },
  { value: "DISTRIBUTION", label: "Distribution" },
  { value: "RETAIL", label: "Retail" },
  { value: "REGULATION", label: "Regulation" },
];

const ALL_ORG_TYPES: { value: OrganizationType; label: string }[] = [
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "RETAILER", label: "Retailer" },
  { value: "SHOP", label: "Shop / Outlet" },
  { value: "REGULATOR", label: "Regulator" },
];

const COMMON_REQUIRED_DOCUMENTS = [
  "Premise Inspection Certificate",
  "RDB Business Registration",
  "Land UPI / Lease Agreement",
  "Environmental Compliance Certificate",
  "Fire Safety Clearance",
  "Food Safety / Hygiene Certificate",
  "Good Manufacturing Practice (GMP)",
  "Staff Health Clearances",
];

const COMMON_PRODUCT_CATEGORIES = [
  "Food & Beverage",
  "Pharmaceuticals",
  "Cosmetics",
  "Chemicals",
  "Construction Materials",
  "Electronics",
  "Textiles",
  "Agricultural Inputs",
];

export function ManageCategoriesDialog({
  open,
  onOpenChange,
}: ManageCategoriesDialogProps) {
  const { data: categories = [], isLoading } = useAllLicenseCategories();
  const createMutation = useCreateLicenseCategory();
  const updateMutation = useUpdateLicenseCategory();
  const deleteMutation = useDeleteLicenseCategory();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("ALL");

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LicenseCategory | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [activity, setActivity] = useState<LicensedActivity>("MANUFACTURING");
  const [appliesTo, setAppliesTo] = useState<OrganizationType[]>(["MANUFACTURER"]);
  const [validityMonths, setValidityMonths] = useState<number>(12);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [newDocInput, setNewDocInput] = useState("");
  const [permittedProducts, setPermittedProducts] = useState<string[]>([]);
  const [newProductInput, setNewProductInput] = useState("");
  const [active, setActive] = useState(true);

  // Reset form
  const resetForm = () => {
    setCode("");
    setName("");
    setActivity("MANUFACTURING");
    setAppliesTo(["MANUFACTURER"]);
    setValidityMonths(12);
    setRequiredDocs([]);
    setNewDocInput("");
    setPermittedProducts([]);
    setNewProductInput("");
    setActive(true);
    setEditingCategory(null);
    setIsEditing(false);
  };

  const startCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const startEdit = (cat: LicenseCategory) => {
    setEditingCategory(cat);
    setCode(cat.code);
    setName(cat.name);
    setActivity(cat.activity);
    setAppliesTo(cat.appliesTo || []);
    setValidityMonths(cat.validityMonths || 12);
    setRequiredDocs(cat.requiredDocuments || []);
    setPermittedProducts(cat.permittedProductCategories || []);
    setActive(cat.active ?? true);
    setIsEditing(true);
  };

  const toggleOrgType = (org: OrganizationType) => {
    if (appliesTo.includes(org)) {
      setAppliesTo(appliesTo.filter((t) => t !== org));
    } else {
      setAppliesTo([...appliesTo, org]);
    }
  };

  const addDoc = (doc: string) => {
    const trimmed = doc.trim();
    if (trimmed && !requiredDocs.includes(trimmed)) {
      setRequiredDocs([...requiredDocs, trimmed]);
      setNewDocInput("");
    }
  };

  const removeDoc = (doc: string) => {
    setRequiredDocs(requiredDocs.filter((d) => d !== doc));
  };

  const addProduct = (prod: string) => {
    const trimmed = prod.trim();
    if (trimmed && !permittedProducts.includes(trimmed)) {
      setPermittedProducts([...permittedProducts, trimmed]);
      setNewProductInput("");
    }
  };

  const removeProduct = (prod: string) => {
    setPermittedProducts(permittedProducts.filter((p) => p !== prod));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please provide a category name");
      return;
    }

    if (!editingCategory && !code.trim()) {
      toast.error("Please provide a unique category code");
      return;
    }

    if (appliesTo.length === 0) {
      toast.error("Select at least one organization type that can apply");
      return;
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          input: {
            name: name.trim(),
            activity,
            appliesTo,
            validityMonths: Number(validityMonths) || 12,
            requiredDocuments: requiredDocs,
            permittedProductCategories: permittedProducts,
            active,
          },
        });
        toast.success(`Category "${name}" updated successfully`);
      } else {
        await createMutation.mutateAsync({
          code: code.trim().toUpperCase().replace(/\s+/g, "_"),
          name: name.trim(),
          activity,
          appliesTo,
          validityMonths: Number(validityMonths) || 12,
          requiredDocuments: requiredDocs,
          permittedProductCategories: permittedProducts,
          active,
        });
        toast.success(`Category "${name}" created successfully`);
      }
      resetForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (cat: LicenseCategory) => {
    if (!confirm(`Are you sure you want to deactivate or delete "${cat.name}"?`)) {
      return;
    }
    try {
      const res = await deleteMutation.mutateAsync(cat.id);
      toast.success(res.message);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActivity =
      selectedActivity === "ALL" || cat.activity === selectedActivity;
    return matchesSearch && matchesActivity;
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                License Category Management
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create, configure, and manage premise & operational licensing categories.
              </DialogDescription>
            </div>
          </div>
          {!isEditing && (
            <Button
              onClick={startCreate}
              size="sm"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Category
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing ? (
            /* CREATE / EDIT FORM */
            <form onSubmit={handleSave} className="space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {editingCategory ? (
                    <>
                      <Pencil className="w-4 h-4 text-primary" />
                      Edit Category: <span className="text-muted-foreground">{editingCategory.name}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-primary" />
                      Create New License Category
                    </>
                  )}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code (Only editable on create) */}
                <div className="space-y-1.5">
                  <Label htmlFor="cat-code" className="text-xs font-medium">
                    Category Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cat-code"
                    disabled={Boolean(editingCategory)}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PHARMACY_PREMISE"
                    className="font-mono text-xs uppercase"
                    required
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Unique uppercase identifier used in rules and registry.
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name" className="text-xs font-medium">
                    Category Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Retail Pharmacy Premise License"
                    className="text-xs"
                    required
                  />
                </div>

                {/* Activity */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Licensed Activity <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={activity}
                    onValueChange={(val) => {
                      if (val) setActivity(val as LicensedActivity);
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ACTIVITIES.map((act) => (
                        <SelectItem key={act.value} value={act.value} className="text-xs">
                          {act.label} ({act.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Validity Period */}
                <div className="space-y-1.5">
                  <Label htmlFor="cat-validity" className="text-xs font-medium">
                    Validity Period (Months)
                  </Label>
                  <Input
                    id="cat-validity"
                    type="number"
                    min={1}
                    max={120}
                    value={validityMonths}
                    onChange={(e) => setValidityMonths(parseInt(e.target.value) || 12)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Applies To (Organization Types) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Applies To Business Types <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_ORG_TYPES.map((org) => {
                    const isSelected = appliesTo.includes(org.value);
                    return (
                      <button
                        key={org.value}
                        type="button"
                        onClick={() => toggleOrgType(org.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/40 text-muted-foreground border-border hover:border-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {org.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Required Documents Builder */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Required Documents Checklist</span>
                  <span className="text-[13px] text-muted-foreground font-normal">
                    {requiredDocs.length} required
                  </span>
                </Label>

                <div className="flex gap-2">
                  <Input
                    value={newDocInput}
                    onChange={(e) => setNewDocInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDoc(newDocInput);
                      }
                    }}
                    placeholder="Type document name and press Enter..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addDoc(newDocInput)}
                    disabled={!newDocInput.trim()}
                    className="text-xs shrink-0"
                  >
                    Add Document
                  </Button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[13px] text-muted-foreground self-center mr-1">Quick Add:</span>
                  {COMMON_REQUIRED_DOCUMENTS.map((doc) => {
                    const isAdded = requiredDocs.includes(doc);
                    if (isAdded) return null;
                    return (
                      <button
                        key={doc}
                        type="button"
                        onClick={() => addDoc(doc)}
                        className="px-2 py-0.5 rounded text-[13px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {doc}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Documents */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-lg border border-border bg-card/40">
                  {requiredDocs.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No documents required yet. Add at least one verification document.
                    </span>
                  ) : (
                    requiredDocs.map((doc) => (
                      <Badge
                        key={doc}
                        variant="secondary"
                        className="text-xs py-1 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 flex items-center"
                      >
                        <FileText className="w-3 h-3 text-primary/70" />
                        {doc}
                        <button
                          type="button"
                          onClick={() => removeDoc(doc)}
                          className="hover:text-destructive transition-colors ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Permitted Products Categories */}
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center justify-between">
                  <span>Permitted Product Categories</span>
                  <span className="text-[13px] text-muted-foreground font-normal">
                    (Leave empty for unrestricted)
                  </span>
                </Label>

                <div className="flex gap-2">
                  <Input
                    value={newProductInput}
                    onChange={(e) => setNewProductInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addProduct(newProductInput);
                      }
                    }}
                    placeholder="Type product category and press Enter..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addProduct(newProductInput)}
                    disabled={!newProductInput.trim()}
                    className="text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[13px] text-muted-foreground self-center mr-1">Quick Add:</span>
                  {COMMON_PRODUCT_CATEGORIES.map((prod) => {
                    const isAdded = permittedProducts.includes(prod);
                    if (isAdded) return null;
                    return (
                      <button
                        key={prod}
                        type="button"
                        onClick={() => addProduct(prod)}
                        className="px-2 py-0.5 rounded text-[13px] bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        {prod}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Products */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-lg border border-border bg-card/40">
                  {permittedProducts.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      Unrestricted — applies to any product category.
                    </span>
                  ) : (
                    permittedProducts.map((prod) => (
                      <Badge
                        key={prod}
                        variant="secondary"
                        className="text-xs py-1 px-2.5 gap-1.5 bg-muted text-foreground border-border flex items-center"
                      >
                        {prod}
                        <button
                          type="button"
                          onClick={() => removeProduct(prod)}
                          className="hover:text-destructive transition-colors ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div>
                  <Label htmlFor="cat-active" className="text-xs font-semibold cursor-pointer">
                    Active for New Applications
                  </Label>
                  <p className="text-[13px] text-muted-foreground">
                    When inactive, applicants cannot submit new applications for this category.
                  </p>
                </div>
                <Switch
                  id="cat-active"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {editingCategory ? "Update Category" : "Create Category"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* CATEGORIES LIST VIEW */
            <div className="space-y-4">
              {/* Search & Activity Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by category name or code..."
                    className="pl-9 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedActivity}
                    onValueChange={(val) => setSelectedActivity(val ?? "ALL")}
                  >
                    <SelectTrigger className="w-[180px] text-xs">
                      <SelectValue placeholder="All Activities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">
                        All Activities
                      </SelectItem>
                      {ALL_ACTIVITIES.map((act) => (
                        <SelectItem key={act.value} value={act.value} className="text-xs">
                          {act.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Categories Table / Cards */}
              {isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-2">
                  <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading license categories...</p>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-border rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">No Categories Found</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                      {searchQuery || selectedActivity !== "ALL"
                        ? "No license categories match your filter criteria."
                        : "No license categories have been created yet."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={startCreate}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Category
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className={cn(
                        "p-4 rounded-xl border transition-all hover:border-primary/40 bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-4",
                        cat.active === false && "opacity-60 bg-muted/20 border-dashed"
                      )}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                            {cat.code}
                          </span>
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {cat.name}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold uppercase tracking-wider py-0 px-2 bg-primary/10 text-primary border-primary/20"
                          >
                            {cat.activity}
                          </Badge>
                          {cat.active === false ? (
                            <Badge variant="outline" className="text-[10px] py-0 px-2 bg-muted text-muted-foreground border-border">
                              Inactive
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Active
                            </Badge>
                          )}
                        </div>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-0.5">
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-muted-foreground/70" />
                            {cat.appliesTo?.length
                              ? cat.appliesTo.join(", ")
                              : "All Organizations"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                            {cat.validityMonths || 12} Months validity
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground/70" />
                            {cat.requiredDocuments?.length || 0} Required Docs
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(cat)}
                          className="text-xs h-8 px-3 gap-1.5 hover:border-primary/40 hover:text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cat)}
                          className="text-xs h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Deactivate / Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card/60 backdrop-blur-sm text-xs text-muted-foreground">
          <span>
            {categories.length} total categories ({categories.filter((c) => c.active !== false).length} active)
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

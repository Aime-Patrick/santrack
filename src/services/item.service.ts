import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ItemKind = "UNIT" | "PACKAGE";
export type PackageType = "BOX" | "CARTON" | "CASE" | "SACK" | "CRATE" | "PALLET";
export type ItemStatus =
  | "ACTIVE"
  | "IN_TRANSIT"
  | "SOLD"
  | "RETURNED"
  | "QUARANTINED"
  | "RECALLED"
  | "EXPIRED"
  | "DAMAGED"
  | "DESTROYED";
export type SealState = "SEALED" | "OPEN" | "EMPTY";
export type LifecycleAction =
  | "QUARANTINE"
  | "RELEASE"
  | "RETURN"
  | "DAMAGE"
  | "EXPIRE"
  | "DESTROY";

export interface Item {
  id: number;
  qrCode: string;
  code: string;
  kind: ItemKind;
  packageType: PackageType | null;
  productId: number | null;
  productName: string | null;
  productSku: string | null;
  batchId: number | null;
  batchCode: string | null;
  serialNumber: string | null;
  quantity: number;
  status: ItemStatus;
  sealState: SealState;
  parentId: number | null;
  parentCode: string | null;
  holderId: number | null;
  holderName: string | null;
  locationId: number | null;
  locationName: string | null;
  consumerRef: string | null;
  expiresOn: string | null;
  expired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterUnitsInput {
  productId: number;
  batchId?: number;
  locationId?: number;
  count: number;
  serialNumbers?: string[];
}

export interface RegisterPackageInput {
  packageType: PackageType;
  productId?: number;
  batchId?: number;
  locationId?: number;
}

export interface PackInput {
  childQrCodes: string[];
}

export interface ContainerContents {
  container: Item;
  remainingCount: number;
  removedCount: number;
  remaining: Item[];
  removed: Item[];
}

export interface ItemListResponse {
  content: Item[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const itemService = {
  /** Register individual unit identities (e.g. 50 bottles from a batch). */
  registerUnits(input: RegisterUnitsInput): Promise<Item[]> {
    return api.post<Item[]>("/api/items/units", input).then((r) => r.data);
  },

  /** Register a new empty package (box, carton, pallet, etc.). */
  registerPackage(input: RegisterPackageInput): Promise<Item> {
    return api.post<Item>("/api/items/packages", input).then((r) => r.data);
  },

  /** List items held by the current organization. */
  list(
    params: { kind?: ItemKind; topLevel?: boolean; page?: number; size?: number } = {}
  ): Promise<ItemListResponse> {
    return api
      .get<ItemListResponse>("/api/items", { params })
      .then((r) => r.data);
  },

  /** Get a single item by its QR code. */
  get(qrCode: string): Promise<Item> {
    return api.get<Item>(`/api/items/${qrCode}`).then((r) => r.data);
  },

  /** Get the contents of a package. */
  contents(qrCode: string): Promise<ContainerContents> {
    return api
      .get<ContainerContents>(`/api/items/${qrCode}/contents`)
      .then((r) => r.data);
  },

  /** Pack scanned child items into a container. */
  pack(qrCode: string, input: PackInput): Promise<ContainerContents> {
    return api
      .post<ContainerContents>(`/api/items/${qrCode}/pack`, input)
      .then((r) => r.data);
  },

  /** Open a sealed package. */
  open(qrCode: string, notes?: string): Promise<Item> {
    return api
      .post<Item>(`/api/items/${qrCode}/open`, { notes })
      .then((r) => r.data);
  },

  /** Remove a single unit from a package. */
  removeUnit(
    qrCode: string,
    childQrCode: string,
    notes?: string
  ): Promise<ContainerContents> {
    return api
      .post<ContainerContents>(`/api/items/${qrCode}/remove`, {
        childQrCode,
        notes,
      })
      .then((r) => r.data);
  },

  /** Apply a lifecycle action: quarantine, release, return, damage, expire, destroy. */
  lifecycle(
    qrCode: string,
    action: LifecycleAction,
    reason?: string
  ): Promise<Item> {
    return api
      .post<Item>(`/api/items/${qrCode}/lifecycle`, { action, reason })
      .then((r) => r.data);
  },

  /** Download the printable QR label PNG for an item. */
  labelUrl(qrCode: string): string {
    const base = api.defaults.baseURL || "";
    return `${base}/api/items/${qrCode}/label`;
  },
};

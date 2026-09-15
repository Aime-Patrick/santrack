import { ActiveSelection, type Canvas, type FabricObject } from "fabric";
import type { LabelFabricObject } from "@/lib/label-fabric-adapter";

export function getLabelGroupId(object: FabricObject): string | undefined {
  const meta = (object as LabelFabricObject).labelMeta;
  if (!meta) return undefined;
  if (typeof meta.groupId === "string" && meta.groupId.length > 0) return meta.groupId;
  const fromSchema = meta.pdfme?.groupId;
  return typeof fromSchema === "string" && fromSchema.length > 0 ? fromSchema : undefined;
}

export function setLabelGroupId(object: LabelFabricObject, groupId: string | undefined) {
  if (!object.labelMeta) return object;
  const pdfme = { ...object.labelMeta.pdfme };
  if (groupId) pdfme.groupId = groupId;
  else delete pdfme.groupId;
  object.labelMeta = {
    ...object.labelMeta,
    groupId,
    pdfme,
  };
  return object;
}

export function collectLabelSelection(active: FabricObject | null | undefined): LabelFabricObject[] {
  if (!active) return [];
  if (active instanceof ActiveSelection) {
    return active.getObjects().filter((object): object is LabelFabricObject => Boolean((object as LabelFabricObject).labelMeta));
  }
  return (active as LabelFabricObject).labelMeta ? [active as LabelFabricObject] : [];
}

export function createLabelGroupId() {
  return `grp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Assign a shared groupId to the current multi-selection (or return false). */
export function groupLabelSelection(canvas: Canvas): boolean {
  const active = canvas.getActiveObject();
  const items = collectLabelSelection(active);
  if (items.length < 2) return false;
  const groupId = createLabelGroupId();
  items.forEach((object) => setLabelGroupId(object, groupId));
  return true;
}

/** Clear groupId from the selection (and siblings sharing that id). */
export function ungroupLabelSelection(canvas: Canvas): boolean {
  const active = canvas.getActiveObject();
  const items = collectLabelSelection(active);
  if (items.length === 0) return false;

  const groupIds = new Set(items.map(getLabelGroupId).filter((id): id is string => Boolean(id)));
  if (groupIds.size === 0) return false;

  canvas.getObjects().forEach((object) => {
    const labelObject = object as LabelFabricObject;
    const id = getLabelGroupId(labelObject);
    if (id && groupIds.has(id)) setLabelGroupId(labelObject, undefined);
  });
  return true;
}

/**
 * If the clicked object belongs to a soft group, expand to an ActiveSelection of all members.
 * Returns true when the selection was expanded.
 */
export function expandSelectionToLabelGroup(canvas: Canvas, active: FabricObject | null | undefined): boolean {
  if (!active || active instanceof ActiveSelection) return false;
  const groupId = getLabelGroupId(active);
  if (!groupId) return false;

  const members = canvas
    .getObjects()
    .filter((object) => getLabelGroupId(object) === groupId) as LabelFabricObject[];
  if (members.length < 2) return false;

  const selection = new ActiveSelection(members, { canvas });
  canvas.setActiveObject(selection);
  canvas.requestRenderAll();
  return true;
}

export function selectionHasLabelGroup(active: FabricObject | null | undefined): boolean {
  return collectLabelSelection(active).some((object) => Boolean(getLabelGroupId(object)));
}

export function canGroupLabelSelection(active: FabricObject | null | undefined): boolean {
  return collectLabelSelection(active).length >= 2;
}

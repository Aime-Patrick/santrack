/**
 * What a product may be sold in (mirrors API `sellableUnits` / DR-09).
 *
 * Base unit always; pack only when `unitsPerPack` is a whole number ≥ 2.
 * An empty list means quote/order in bare product units.
 */

export type SellableProduct = {
  baseUnit: string | null;
  packUnit: string | null;
  unitsPerPack: number | null;
};

function isWholePack(unitsPerPack: number | null): boolean {
  return (
    unitsPerPack !== null &&
    Number.isInteger(unitsPerPack) &&
    unitsPerPack >= 2
  );
}

export function sellableUnits(product: SellableProduct): string[] {
  const units: string[] = [];

  if (product.baseUnit) {
    units.push(product.baseUnit);
  }
  if (product.packUnit && isWholePack(product.unitsPerPack)) {
    units.push(product.packUnit);
  }

  return units;
}

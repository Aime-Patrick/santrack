declare module "rwanda" {
  /** Returns all provinces in Rwanda. */
  export function Provinces(): string[];

  /** Returns districts, optionally filtered by province name(s). */
  export function Districts(province?: string | string[]): string[] | undefined;

  /** Returns sectors, optionally filtered by province and district. */
  export function Sectors(province?: string, district?: string): string[] | undefined;

  /** Returns cells, optionally filtered by province, district, and sector. */
  export function Cells(province?: string, district?: string, sector?: string): string[] | undefined;

  /** Returns villages, optionally filtered by province, district, sector, and cell. */
  export function Villages(province?: string, district?: string, sector?: string, cell?: string): string[] | undefined;
}

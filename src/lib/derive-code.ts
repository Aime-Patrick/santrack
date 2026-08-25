/**
 * "Dairy products" -> "DAIRY_PRODUCTS". Mirrors `deriveCode` on the server.
 *
 * Used only to preview what a name will be filed as. The server derives the
 * real code, so drift between the two costs a hint, never a wrong code.
 */
export function deriveCode(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 40);
}

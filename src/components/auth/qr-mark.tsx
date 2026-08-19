import { cn } from "@/lib/utils";

/**
 * QR-code motif: three finder patterns plus a deterministic dot field.
 * The signature element of the brand — a product's permanent QR identity.
 */
export function QrMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("text-warning", className)}
    >
      <rect width="16" height="16" fill="currentColor" opacity="0.05" rx="2" />
      {cells().map(({ r, c }) => (
        <rect
          key={`${r}-${c}`}
          x={c * 2 + 0.5}
          y={r * 2 + 0.5}
          width="1"
          height="1"
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

function cells(): { r: number; c: number }[] {
  const out: { r: number; c: number }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const inFinder =
        (r < 3 && c < 3) || (r < 3 && c >= 5) || (r >= 5 && c < 3);
      if (inFinder) {
        out.push({ r, c });
      } else if ((r * 7 + c * 3) % 5 === 0) {
        out.push({ r, c });
      }
    }
  }
  return out;
}

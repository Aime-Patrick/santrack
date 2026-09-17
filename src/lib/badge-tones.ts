/**
 * Solid Rwanda-flag chips. Badge fills are never translucent.
 * Blue, yellow, and green are the flag; danger stays for failures.
 */
export const FLAG_BLUE = "bg-rwanda-blue text-white";
export const FLAG_YELLOW = "bg-rwanda-yellow text-white";
export const FLAG_GREEN = "bg-rwanda-green text-white";
export const FLAG_NEUTRAL = "bg-muted-foreground text-white";
export const FLAG_DANGER = "bg-danger text-white";

/** Produce = blue, move = yellow, sell = green. */
export const ORG_TYPE_BADGE: Record<string, string> = {
  MANUFACTURER: FLAG_BLUE,
  WAREHOUSE: FLAG_YELLOW,
  DISTRIBUTOR: FLAG_YELLOW,
  RETAILER: FLAG_GREEN,
  SHOP: FLAG_GREEN,
  REGULATOR: FLAG_BLUE,
  CONSUMER: FLAG_YELLOW,
};

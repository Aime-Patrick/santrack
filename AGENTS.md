<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# San Track — Industry Management System

Full spec: `Product Traceability Platform — Core Architecture  *.md` at the repo root.

## Domain rules (do not violate)

- **QR identity starts at the manufacturer.** A product's permanent QR identity is minted when the manufacturer registers the product/package. Shops, warehouses and consumers never create identities — they only record events against existing ones. The identity never changes through the lifecycle.
- Products/units have one permanent QR identity; packages (box → pallet) have their own QR identities and parent-child relationships.
- Traceability events are append-only; corrections create compensating events, never deletions.
- One physical product keeps its identity from manufacturing to consumer/end-of-life (sale, return, expiry, damage, recall, destruction).

## Design system

**Brand colors — Rwanda flag:**
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#067eda` | Brand blue, buttons, links, focus rings |
| `success` | `#00953C` | Rwanda green — verified, active, completed |
| `warning` | `#facb2d` | Rwanda yellow — expiring, attention, sun |
| `danger` | `#C62828` | Expired, recalled, blocked |
| `foreground` | `#172033` | Main text |
| `muted-foreground` | `#5F6B7A` | Supporting text |
| `faint` | `#8994A3` | Metadata, disabled |
| `border` | `#D9E1EA` | Dividers, card borders |
| `background` | `#F7F9FC` | Page background |
| `card` | `#FFFFFF` | Surfaces, panels |

**Fonts:** Inter (body), Geist Mono (code/QR IDs/labels).  
**Radius:** 6px small, 8px medium (cards), 12px large.  
**Always use** `text-foreground`, `text-muted-foreground`, `text-faint`, `bg-primary`, `text-danger`, etc. — never hardcoded hex values or tailwind default colors.

## Frontend conventions

- **UI components:** Use shadcn/ui components from `src/components/ui/` (card, badge, avatar, table, select, tabs). Install new ones via `pnpm dlx shadcn@latest add <component>`.
- **Charts:** Recharts for all charts (line, pie/donut). Import from `recharts` directly.
- **Data fetching:** plain fetchers in `src/lib/api.ts`, wrapped by React Query hooks in `src/hooks/<feature>.ts` with a query-key factory. Components never call axios directly.
- **Forms:** react-hook-form + zod (`zodResolver`), `useWatch` (not `form.watch`).
- **Design language:** San Track brand — split-screen `AuthShell` for auth flows, QR-finder `QrMark` signature in primary blue, Rwanda flag green/yellow for status, golden sun symbol, Rwanda flag wave at bottom, Inter typeface, Geist Mono for identity/code-like labels. Animated Rwanda flag border on auth cards.
- **Dashboard:** KPI stat cards, Production Overview line chart, Industries by Category donut chart, Recent Activities table, Notifications panel.
- `NEXT_PUBLIC_DESIGN_MODE=true` simulates backend flows for UI preview; auth hooks accept `enabled: false` in design mode.

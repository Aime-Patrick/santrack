# Frontend (Next.js App Router)

This frontend provides:

- Auth pages (`/login`, `/register`)
- Protected dashboard routes (`/dashboard`, `/dashboard/items`)
- Responsive dashboard layout with sidebar + navbar
- Reusable UI primitives and loading/error states

## Environment

Copy and configure:

```bash
cp .env.example .env.local
```

Required values:

- `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`)

## Development

```bash
pnpm install
pnpm run dev -- --port 3001
```

## Quality checks

```bash
pnpm run lint
pnpm run build
```

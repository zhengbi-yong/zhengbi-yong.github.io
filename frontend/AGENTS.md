# Frontend AGENTS.md

This file applies to `frontend/`. Read the repository root [AGENTS.md](/home/Sisyphus/zhengbi-yong.github.io/AGENTS.md) first, then use these frontend-specific rules.

## Stack

- Next.js App Router on `src/app`
- React 19
- TypeScript with `"strict": false` in `tsconfig.json`
- pnpm workspace commands run from `frontend/`

## Where To Work

- `src/app/`: routes, layouts, server/client boundaries
- `src/components/`: reusable UI and MDX-rendered components
- `src/lib/`: providers, API clients, runtime helpers
- `data/blog/`: source MDX content used by the static content pipeline
- `tests/`: centralized Vitest and integration tests
- `e2e/`: Playwright coverage

## MDX Rules

- Static MDX content is rendered through `MDXLayoutRenderer` and the shared component map in `src/components/MDXComponents.tsx`.
- Runtime MDX from the API is rendered through `src/lib/mdx-runtime.tsx`, which reuses the same component map.
- Add new MDX UI, shortcode mappings, or fenced-code handlers in `src/components/MDXComponents.tsx` so static and runtime rendering stay aligned.
- `abc` fenced code blocks are already handled in `src/components/MDXComponents.tsx`.
- `abcjs` audio styles are loaded once in `src/app/layout.tsx`.

## Admin And Data Flow

- `/admin` is the custom admin surface under `src/app/admin/`.
- The admin shell is wired through `src/app/admin/layout.tsx` and `src/lib/providers/refine-provider.tsx`.
- Payload packages exist in the frontend, but do not assume Payload owns the `/admin` route.
- Blog detail pages intentionally use the database/API path. Keep the `ALWAYS use database - no static fallback` behavior in `src/app/blog/[...slug]/page.tsx` unless the architecture is deliberately changed.

## Testing

- Put frontend unit and integration coverage under `tests/`.
- Put browser flows under `e2e/`.
- When changing MDX rendering, content ingestion, or the Refine admin provider, add or update tests close to those areas.

## Avoid Bad Assumptions

- Do not assume NextAuth is part of the current auth flow.
- Do not rely on `frontend/node_modules/next/dist/docs/`; that path is not present in this repo.
- If frontend work depends on backend crates, the actual crate names are `api`, `core`, `db`, `shared`, and `worker`.
- Some supplemental docs in the repo lag the code. Prefer live code paths over stale prose when they disagree.

## Useful Commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Kindred Coffee Supply

## Project overview

Agentic-commerce project for the Razorpay AI Buildathon (Track 01: "AI Growth & Agentic Commerce"). A fictional specialty-coffee store where two AI agents act on a shared, deterministic Policy Gate:

- **Merchant Agent** (growth half) — conversational selling, upsell, bundles, cross-sell to humans.
- **Buyer Agent** (agentic-commerce half) — fetches the catalog, reasons over a goal + budget, checks out with zero human clicks.

Every money action is bounded by a signed, time-bounded **mandate** and explained by a signed **receipt**; an append-only, hash-chained audit trail is verifiable by a third party via a runnable tamper-tester.

**This repo currently holds the spec + project scaffold.** The buildable spec lives at `.scratch/agentic-commerce/spec.md` (29.6 KB). The wayfinding map lives at `.scratch/agentic-commerce/map.md` with 18 decision tickets under `.scratch/agentic-commerce/issues/`. UI design is deferred (ticket 11 open) until design inspiration is supplied.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.4.2 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (base-nova preset, CSS variables) |
| Database / Auth | Supabase (Postgres, Auth, RLS, Realtime) via `@supabase/supabase-js` + `@supabase/ssr` |
| Payments | Razorpay (test mode only) |
| Package manager | pnpm 10.29.3 |
| Linting | ESLint 9 + eslint-config-next |
| Unit tests | Vitest (unit tests only — no integration/e2e by decision) |

**Important:** Next.js 16 has breaking changes. Before writing code, read the relevant guide in `node_modules/next/dist/docs/`. The `middleware` file convention is deprecated — use `proxy.ts` (already migrated).

## Project structure

```
aiag/
├── app/                    # Next.js App Router (pages, layouts, app/api/ Route Handlers)
├── components/             # shadcn/ui components (components/ui/) + shared UI
│   └── ui/                 # shadcn primitives (button, etc.)
├── lib/                    # Server modules (testable logic, out of the HTTP layer)
│   ├── supabase/           # Supabase clients (client.ts, server.ts)
│   ├── utils.ts            # cn() helper (shadcn)
│   └── (future) agent/     # Merchant + Buyer agents
│   └── (future) policy/    # Policy Gate, mandates, receipts
│   └── (future) payments/  # Razorpay client, webhooks
│   └── (future) prompts/   # Versioned prompt files
├── proxy.ts                # Supabase session-refresh proxy (Next 16 convention)
├── public/                 # Static assets
├── .env                    # Secrets (gitignored) — Razorpay test keys + Supabase vars
├── .scratch/               # Wayfinding map, tickets, spec, research (gitignored)
├── GLOSSARY.md             # Domain terms (gitignored, local)
├── AGENTS.md               # This file
└── components.json         # shadcn config
```

## Key commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build (TypeScript check included)
pnpm start        # Start production server
pnpm lint         # ESLint
```

## Environment variables

See `.env` (gitignored). Required:

| Variable | Purpose |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay test key ID (`rzp_test_…`) |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key ID exposed to the browser |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, never exposed) |

**Rules:** never commit `.env`. Never log or return secret values. Never put keys in client bundles. Razorpay is test-mode only (no KYC, no live money).

## Architecture conventions

- **Server modules in `lib/`, HTTP in `app/api/`.** `lib/` holds testable logic (agents, policy, payments); Route Handlers in `app/api/` are thin wrappers. This keeps the gate and agents unit-testable.
- **Money as integer subunits (paise/cents).** No float arithmetic on money anywhere.
- **Rolling daily caps** reset at midnight in the merchant's configured timezone (default UTC).
- **Seed data** from a fixed seed (deterministic) for reproducible demos.
- **Supabase clients:** use `lib/supabase/client.ts` in Client Components, `lib/supabase/server.ts` in Server Components/Route Handlers/Server Actions. The proxy (`proxy.ts`) refreshes the session — do not remove it.
- **RLS per role** (owner/admin/viewer) on every Supabase table; server-side writes use the service role (bypass).
- **Migrations:** SQL files in `supabase/migrations/`, applied via `supabase db push`. **Always run `supabase db push --dry-run` first** to preview what will be applied and catch breaking changes (dropped columns, type mismatches, constraint violations) before touching the database. Only run the real `supabase db push` after the dry run is clean. Never apply a migration blind.

## Conventions

- **Path alias:** `@/*` maps to the project root (e.g., `@/lib/utils`, `@/components/ui/button`).
- **Components:** shadcn/ui primitives in `components/ui/`; shared components in `components/`. Add new shadcn components with `npx shadcn@latest add <component>`.
- **Tailwind v4:** no `tailwind.config.js` — configuration lives in `app/globals.css` via `@theme`. Use CSS variables for theming.
- **TypeScript strict mode** is on. Avoid `any`; use proper types.
- **No integration/e2e tests** (by decision). Vitest unit tests only (gate rules, mandate lifecycle, receipt hash/signature, tamper-tester).
- **No observability beyond the audit trail** (by decision). The audit trail is the only observability surface.

## Important rules

1. **Test mode only.** All Razorpay calls use test keys. Never switch to live mode or implement KYC-gated features (autopay tokens, live payouts, bank transfer, emandate, paylater, cardless EMI, international, BharatQR, RazorpayX/Route).
2. **Idempotency is refund-only** in Razorpay. Order creation needs app-side dedupe via `X-Idempotency-Key` + a server dedupe table.
3. **UPI Intent and QR scans are live-mode only.** The demo must use UPI collect / mock bank page.
4. **Payment Links are capped at 30 per business in test mode.** Don't create more in dev/test loops.
5. **Webhook signature** is HMAC-SHA256 over the **raw body** with the **webhook secret** (not the key secret). Dedupe via `x-razorpay-event-id`.
6. **All money as integer subunits** (paise/cents). No float arithmetic on money.
7. **Secrets never in client bundles, never logged, never returned in API responses.**
8. **Migrations: always dry-run first.** Run `supabase db push --dry-run` before every `supabase db push`. Never apply a migration without previewing it.

## Spec & wayfinding

- **Spec:** `.scratch/agentic-commerce/spec.md` — the buildable spec (16 sections). Read this before building any feature.
- **Map:** `.scratch/agentic-commerce/map.md` — the wayfinding map (index of decisions).
- **Tickets:** `.scratch/agentic-commerce/issues/` — one file per decision ticket.
- **Research:** `.scratch/agentic-commerce/research/` — findings from the 4 research tickets.
- **Glossary:** `GLOSSARY.md` — domain terms (implementation-free).
- **UI design:** deferred. Ticket 11 (`Web app UX blueprint`) is open until design inspiration is supplied. Don't invent a visual design; ask the user.

## Domain terms (quick reference)

- **Merchant Agent** — AI that sells for the merchant (growth half).
- **Buyer Agent** — AI that buys from the merchant (agentic-commerce half).
- **Policy Gate** — deterministic service that vets every money-adjacent action; holds veto.
- **Mandate** — signed, scoped, time-bounded authorization to spend.
- **Receipt** — canonical signed record of a money-adjacent action (proposal, rule checked, outcome, reason, hashes).
- **Audit Trail** — append-only log of every money-adjacent action, proposal, and verdict.
- **Quote** — authoritative priced cart (prices re-fetched), 5-min TTL; distinct from an order.
- **SKU** — purchasable unit; a Product may have multiple SKUs (variants).

See `GLOSSARY.md` for the full list. (Note: `GLOSSARY.md` and `.scratch/` are gitignored — local-only artifacts.)

## Next.js 16 notes

- This is **not** the Next.js you know. Read `node_modules/next/dist/docs/` before writing code.
- `middleware.ts` is deprecated → use `proxy.ts` (already migrated).
- `cookies()` is async in Server Components/Route Handlers.
- Turbopack is the default bundler.
- Cache Components and Partial Prefetching are enabled by default.
- Heed deprecation notices; the AGENTS.md `nextjs-agent-rules` block is auto-regenerated by `next dev`.

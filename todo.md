# SlashCheckout — Implementation Todo

## Phase 1: Foundation ✅
- [x] 1.1 Create Supabase migration: products, skus tables
- [x] 1.2 Create Supabase migration: mandates, receipts, audit_events tables
- [x] 1.3 Create Supabase migration: orders, payments, idempotency_keys, agent_keys, processed_events tables
- [x] 1.4 Create Supabase migration: RLS policies per role (owner/admin/viewer)
- [x] 1.5 Create Supabase migration: hash-chain trigger on audit_events (prevent UPDATE/DELETE)
- [x] 1.6 Seed data: 24 SKUs across 5 categories (lib/data/products.ts)
- [x] 1.7 Supabase Auth (email/password, roles) — login/register pages
- [x] 1.8 Supabase clients (client.ts, server.ts)
- [x] 1.9 .env with Supabase + Razorpay test keys + Groq API key

## Phase 2: Policy Gate & Trust Spine (lib/policy/) ✅
- [x] 2.1 Policy Gate: evaluate() with 7 rules
- [x] 2.2 Mandate: create, validate, narrow, revoke, sign/verify
- [x] 2.3 Receipt: canonical body, hash, signature, verify
- [x] 2.4 Audit trail: append-only, hash-chained
- [x] 2.5 Tamper tester: CLI script
- [x] 2.6 Unit tests for Policy Gate rules (12 tests)
- [x] 2.7 Unit tests for mandate lifecycle (6 tests)
- [x] 2.8 Unit tests for receipt hash/signature (5 tests)
- [x] 2.9 Unit tests for tamper tester (6 tests)

## Phase 3: Payments (lib/payments/) ✅
- [x] 3.1 Razorpay client setup (test mode)
- [x] 3.2 Order creation with app-side dedupe
- [x] 3.3 Payment capture
- [x] 3.4 Webhook handler (HMAC-SHA256, event-id dedupe)
- [x] 3.5 Refund handling (full/partial, gate check, audit entry)
- [x] 3.6 Dispute state machine

## Phase 4: Machine Surface (app/api/) ✅ (partial)
- [x] 4.1 Catalog feed endpoint
- [x] 4.2 Quote endpoint
- [x] 4.4 Checkout endpoint
- [x] 4.7 Webhook receiver endpoint
- [x] 4.3 Mandate exchange endpoint
- [x] 4.5 Order/payment status endpoint
- [x] 4.6 Receipt fetch endpoint
- [x] 4.8 Agent key management
- [x] 4.9 Rate limiting

## Phase 5: Agents (lib/agent/) ✅ (partial)
- [x] 5.1 LLM provider interface (Gemini + Groq)
- [x] 5.2 LangGraph state schemas (MerchantState, BuyerState)
- [ ] 5.3 LangGraph checkpointer (Supabase Postgres) — code present; Postgres path unverified (needs SUPABASE_DB_URL)
- [x] 5.4 LangGraph tools (searchCatalog, proposeBundle, etc.) — now real (DB + Policy Gate)
- [x] 5.5 Merchant Agent graph (real catalog, real gate, LLM reasoning, retry, HITL gate)
- [x] 5.6 Buyer Agent graph (real catalog, real gate, LLM reasoning, retry, HITL auto-approve)
- [x] 5.7 HITL interrupt/resume (interrupt() in graphs; /api/agent/resume endpoint)
- [x] 5.8 Retry + fallback (retryPolicy on nodes; abort on exhaustion)
- [x] 5.9 Streaming (SSE) — real /api/agent/stream with node/tool/gate/receipt events
- [x] 5.10 Agent prompts (versioned files)
- [x] 5.11 Unit tests: Policy Gate node, mandate, receipt, tamper tester (39 tests)
- [x] 5.12 Unit tests: graph routing, retries, HITL with fake LLM (8 new tests)

## Phase 6: Web App (app/) ✅
- [x] 6.1 Auth: login, register, role-based routing
- [x] 6.2 Storefront: product grid, detail, cart
- [x] 6.3 Chat surface: Merchant Agent, multi-turn, cart sidebar, upsells
- [x] 6.4 Checkout: quote review → mandate check → payment → receipt
- [x] 6.5 Merchant dashboard: KPI row, revenue, top products, by category
- [x] 6.6 Live audit trail: (placeholder with mock data)
- [x] 6.7 Agent-activity view: reasoning traces, proposal log, mandate/receipt chain
- [x] 6.8 Buyer dashboard (order history, receipts, mandates)
- [x] 6.9 Merchant product CRUD — DB-backed add/edit/delete + restock steppers + search/filter, writes via merchant-guarded /api/products
- [x] 6.10 Analytics: AI restock forecast, NL insights (real data + bklit charts)
- [x] 6.11 Refunds/disputes UI (real refund API + audit + dashboard UI)
- [x] 6.12 Merchant orders view — orders table with line-item detail dialog + receipt links (/dashboard/orders)
- [x] 6.13 Merchant area shell — shared sub-nav (Overview/Orders/Products/Refunds/Analytics) + toasts
- [x] 6.14 Responsive tables — `table-cards` utility (globals.css): below 640px every table row becomes a stacked label/value card via `data-label`; applied to all tables (dashboard, agent-activity, orders, products, refunds, analytics, buyer, checkout). Desktop unchanged.

## Phase 7: Tamper Tester & CLI ✅
- [x] 7.1 Tamper tester script
- [ ] 7.2 Seed script for reproducible demo data
- [ ] 7.3 Demo mode flag

## Phase 9: LLM integration (done 2026-10-18)
- [x] LLM provider auto-detect + fallback (Groq active: openai/gpt-oss-20b; Gemini when GOOGLE_API_KEY set)
- [x] Real tool-calling: searchCatalog, proposeBundle, evaluatePolicy against live DB + real Policy Gate
- [x] Merchant Agent chat endpoint (/api/agent/chat) + chat page wired (multi-turn, proposals, gate verdicts, reasoning trace)
- [x] Buyer Agent goal-based purchase (/api/agent/buy with goal+budgetPaise): LLM plans cart, gate + capture + receipt
- [x] LangGraph graphs upgraded: real catalog, real gate, LLM reasoning, retry policies (MemorySaver)
- [x] Real SSE streaming (/api/agent/stream): node/tool/gate/receipt/done events
- [x] Agent-activity page now reads real audit events, receipts, mandates from the DB
- [x] Buyer dashboard now reads real orders/receipts/mandates via API (camelCase envelope fix)
- [ ] Checkpointer (PostgresSaver) + HITL interrupt/resume - blocked on SUPABASE_DB_URL
- [ ] LangGraph unit tests (fake LLM, MemorySaver, fixtures) - pending
- [ ] Multi-turn server-side session persistence for Merchant Agent - pending
## Phase 8: Integration & Verification
- [x] 8.1 Typecheck (tsc --noEmit) clean
- [x] 8.2 Lint clean
- [x] 8.3 Build clean
- [x] 8.4 All unit tests pass (39/39)
- [x] 8.5 Manual smoke test: merchant login, CRUD product, buyer login, browse, chat, checkout, receipt
- [x] 8.6 Manual smoke test: flagship failure (policy-blocked purchase + swap) — verified: buyer-agent block (velocity) with cheaper in-stock alternatives + blocked receipt
- [ ] 8.7 Manual smoke test: tamper tester
- [x] 8.8 Mark completed items in todo.md
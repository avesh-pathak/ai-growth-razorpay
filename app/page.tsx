"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Bot, Link2, MousePointerClick, ShieldCheck } from "lucide-react";
import { PRODUCTS } from "@/lib/data/products";

export default function Home() {
  return (
    <main id="main" className="mesh-bg min-h-screen">
      {/* Hero — compact, no empty space */}
      <section className="relative">
        <div className="max-w-frame mx-auto w-full px-6 sm:px-8 lg:px-12 pt-16 pb-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 items-start">
            <div>
              <h1 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-foreground">
                Agentic commerce,<br />
                <span className="text-foreground/50">explainable by design.</span>
              </h1>
              <p className="mt-6 max-w-[44ch] text-[1.0625rem] leading-[1.6] text-muted-foreground">
                A store where a Merchant Agent sells and a Buyer Agent buys. Every money action gated, bounded, mandated, and receipted.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/agent-activity"
                  className="group inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[14px] font-medium text-brand-foreground transition-all hover:opacity-90"
                >
                  Watch the agents run
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand-foreground/10 transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="size-3" />
                  </span>
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Open the dashboard
                </Link>
              </div>
            </div>

            {/* Compact audit mock */}
            <div className="bg-card border border-border rounded-2xl p-1">
              <div className="rounded-[calc(1.25rem-0.25rem)] bg-background/60 p-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <span className="size-2 rounded-full bg-destructive/70" />
                  <span className="size-2 rounded-full bg-brand-accent/70" />
                  <span className="size-2 rounded-full bg-positive/70" />
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground">settle · audit trail</span>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  {[
                    { a: "buyer-agent", act: "checkout.completed", v: "allowed" },
                    { a: "policy-gate", act: "evaluate", v: "allowed" },
                    { a: "merchant-agent", act: "proposal.blocked", v: "blocked" },
                    { a: "buyer-agent", act: "quote.requested", v: "allowed" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">{r.a}</span>
                        <span className="font-mono text-[10px] text-foreground truncate">{r.act}</span>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${r.v === "blocked" ? "bg-destructive/10 text-destructive" : "bg-positive/10 text-positive"}`}>
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip — one gate, one chain */}
      <section className="dark border-y border-border bg-[#111113]">
        <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <ul role="list" className="flex flex-col gap-6 py-8 sm:grid sm:grid-cols-4 sm:gap-8 sm:py-12 lg:gap-12">
            {[
              { k: "7", v: "gate rules", Icon: ShieldCheck, hue: "text-brand" },
              { k: "2", v: "agents, one gate", Icon: Bot, hue: "text-brand-secondary" },
              { k: "0", v: "human clicks", Icon: MousePointerClick, hue: "text-brand-tertiary" },
              { k: "All", v: "receipts chained", Icon: Link2, hue: "text-brand-quaternary" },
            ].map((s, i) => (
              <li key={s.v} className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                {i < 3 && (
                  <span
                    aria-hidden
                    className="absolute left-[13.5px] top-1/2 -bottom-10 w-px bg-foreground/20 sm:top-[13.5px] sm:bottom-auto sm:right-[-46px] sm:h-px sm:w-auto lg:right-[-62px]"
                  />
                )}
                <span
                  className={`verify-chip relative inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-current ring-2 ring-[#111113] ${s.hue}`}
                  style={{ "--station": i } as CSSProperties}
                >
                  <s.Icon className="size-3.5 text-[#111113]" aria-hidden />
                </span>
                <span className="flex items-baseline gap-2.5 sm:mt-4 sm:flex-col sm:items-start sm:gap-1.5">
                  <span className="font-heading text-[2rem] font-medium leading-none tracking-[-0.02em] text-foreground tabular-nums sm:text-[2.25rem]">
                    {s.k}
                  </span>
                  <span className="font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {s.v}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-24">
        <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <div className="max-w-[42rem]">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              Three steps, end to end
            </h2>
            <p className="mt-4 text-[1.125rem] leading-[1.6] text-muted-foreground">
              A Merchant Agent sells, a Buyer Agent buys, and a Policy Gate decides. Every step logged and receipted.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { n: "One", t: "Merchant Agent sells", d: "A shopper chats in plain language. The agent proposes bundles. Every proposal is gate-checked before display." },
              { n: "Two", t: "Buyer Agent buys", d: "An autonomous agent fetches the catalog, plans a cart, quotes, checks both mandates, checks out. Zero human clicks." },
              { n: "Three", t: "Policy Gate decides", d: "Seven rules, both mandates, margin floors, caps, velocity. First failure wins. Reason code attached." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">{s.n}</span>
                <h3 className="mt-3 text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">{s.t}</h3>
                <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust spine — asymmetrical bento */}
      <section className="py-24">
        <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <div className="max-w-[42rem]">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              The trust spine
            </h2>
            <p className="mt-4 text-[1.125rem] leading-[1.6] text-muted-foreground">
              One runtime, one database, one auth layer, one control plane. Every money action explainable, bounded and gated.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Policy Gate</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Deterministic, deny-by-default. Seven rules: mandate validity, category whitelist, price source-of-truth, margin floor, per-order cap, rolling daily cap, velocity. First failure wins.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Mandates</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Signed, scoped, time-bounded. Buyer may narrow, never widen.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Receipts</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Canonical signed JSON plus human view. Hash-chained, append-only.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Merchant & Buyer Agents</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Merchant Agent: conversational selling, gate-checked proposals. Buyer Agent: autonomous purchase, zero human clicks. Both share one Policy Gate.
              </p>
            </div>
          </div>
          <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Runs entirely on Razorpay test-mode rails · no real money moves
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="py-24">
        <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              The catalog agents read
            </h2>
            <Link href="/products" className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              View all {PRODUCTS.length}
            </Link>
          </div>
          <p className="mt-4 text-[1.125rem] leading-[1.6] text-muted-foreground">
            {PRODUCTS.length} SKUs across 5 categories. Priced, in stock, and agent-readable.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PRODUCTS.slice(0, 8).map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="group rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                </div>
                <p className="mt-3 text-[13px] font-medium text-foreground truncate">{p.name}</p>
                <p className="text-[12px] text-muted-foreground">₹{(p.pricePaise / 100).toLocaleString("en-IN")}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* See it run */}
      <section className="py-24">
        <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
                Watch a Buyer Agent complete a purchase
              </h2>
              <p className="mt-4 text-[1.125rem] leading-[1.6] text-muted-foreground max-w-[48ch]">
                Reasoning trace, gate verdicts, quote, checkout, receipt. All logged and auditable.
              </p>
              <Link
                href="/agent-activity"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3 text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
              >
                Explore the demo
                <span className="flex size-6 items-center justify-center rounded-full bg-brand-foreground/10">
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-3">
                {[
                  { t: "14:32:01", a: "buyer-agent", act: "checkout.completed", v: "allowed", rule: "—" },
                  { t: "14:31:58", a: "policy-gate", act: "evaluate", v: "allowed", rule: "all 7 passed" },
                  { t: "14:31:40", a: "merchant-agent", act: "proposal.blocked", v: "blocked", rule: "margin_floor" },
                  { t: "14:30:12", a: "buyer-agent", act: "quote.requested", v: "allowed", rule: "—" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">{r.t}</span>
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">{r.a}</span>
                      <span className="font-mono text-[11px] text-foreground truncate">{r.act}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] text-muted-foreground">{r.rule}</span>
                      <span className={`font-mono text-[10px] font-medium ${r.v === "blocked" ? "text-destructive" : "text-positive"}`}>
                        {r.v}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "@/lib/data/products";
import { PurchaseFlowSection } from "@/components/purchase-flow/PurchaseFlowSection";
import { CommerceHero } from "@/components/purchase-flow/scene/live";

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

            {/* The commerce loop, running itself */}
            <CommerceHero />
          </div>
        </div>
      </section>

      {/* How a purchase flows — three working machines */}
      <PurchaseFlowSection />

      {/* Trust spine — warm band, station-hued bento */}
      <section className="trust-band border-y border-border py-24">
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
            <div data-station="gate" className="trust-card rounded-2xl bg-card p-7 md:col-span-2">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Policy Gate</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Deterministic, deny-by-default. Seven rules, checked in precedence order. First failure wins.
              </p>
              <ul role="list" className="mt-5 flex flex-wrap gap-2">
                {["mandate validity", "category whitelist", "price source-of-truth", "margin floor", "per-order cap", "rolling daily cap", "velocity"].map((rule, i) => (
                  <li key={rule} className="rounded-sm border border-border px-2 py-1 font-mono text-[12px] uppercase leading-4 tracking-[0.02em] tabular-nums text-foreground/80">
                    <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span> {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div data-station="mandate" className="trust-card rounded-2xl bg-card p-6">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Mandates</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Signed, scoped, time-bounded. Buyer may narrow, never widen.
              </p>
            </div>
            <div data-station="receipt" className="trust-card rounded-2xl bg-card p-6">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Receipts</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Canonical signed JSON plus human view. Hash-chained, append-only.
              </p>
            </div>
            <div data-station="agents" className="trust-card rounded-2xl bg-card p-6 md:col-span-2">
              <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-foreground">Merchant & Buyer Agents</h3>
              <p className="mt-2 text-[1rem] leading-[1.6] text-muted-foreground">
                Merchant Agent: conversational selling, gate-checked proposals. Buyer Agent: autonomous purchase, zero human clicks. Both share one Policy Gate.
              </p>
            </div>
          </div>
          <p className="mt-8 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />
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

import { formatPaise } from "@/lib/data/products";
import { cn } from "@/lib/utils";

const ITEMS = [
  { name: "V60", sub: "Brewers", price: 189900, pid: "p1" },
  { name: "C40", sub: "Grinders", price: 1299900, pid: "p7" },
  { name: "Stagg", sub: "Kettles", price: 699900, pid: "p11" },
  { name: "scale", sub: "Accessories", price: 249900, pid: "p15" },
  { name: "filters", sub: "Accessories", price: 49900, pid: "p14" },
  { name: "beans", sub: "Beans", price: 74900, pid: "p21" },
];

const TOTAL = ITEMS.reduce((s, i) => s + i.price, 0);

const RULES = [
  { name: "Mandates", status: "passed" },
  { name: "Categories", status: "passed" },
  { name: "Price check", status: "passed" },
  { name: "Margin floor", status: "passed" },
  { name: "Order cap", status: "failed" },
  { name: "Daily cap", status: "skipped" },
  { name: "Velocity", status: "skipped" },
];

const AUDIT = [
  "shopper.requested",
  "merchant.proposal_created",
  "merchant.proposal_submitted",
  "policy.evaluating",
  "policy.blocked · mandate_exceeded",
];

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-dm-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "positive" | "destructive" | "brand" | "muted" }) {
  const cls =
    tone === "positive"
      ? "border-positive/40 bg-positive/10 text-positive"
      : tone === "destructive"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : tone === "brand"
      ? "border-brand/40 bg-brand/10 text-brand"
      : "border-border bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-dm-mono text-[10px] uppercase tracking-[0.12em]", cls)}>
      {children}
    </span>
  );
}

export default function PurchaseRuntimePage() {
  return (
    <main id="main" className="min-h-[calc(100dvh-4.5rem)] bg-background">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-dm-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">slashcheckout</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-dm-mono text-[11px] uppercase tracking-[0.16em] text-foreground">purchase runtime</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 font-dm-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
              <span className="size-1.5 rounded-full bg-brand" /> Merchant agent
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 font-dm-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
              <span className="size-1.5 rounded-full bg-destructive" /> Policy gate
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 font-dm-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
              <span className="size-1.5 rounded-full bg-positive" /> Buyer agent
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="md:col-span-2 xl:col-span-2">
            <Eyebrow>Merchant agent · conversation</Eyebrow>
            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Shopper</p>
                <p className="mt-1 text-[14px] leading-[1.5] text-foreground">Can you put together a midweek pour-over setup — the essentials?</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Merchant agent</p>
                <p className="mt-1 text-[14px] leading-[1.5] text-foreground">On it — I pulled six items from the live catalog. Bundle proposal below, priced at vendor list.</p>
                <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">Proposal submitted — the Policy Gate reviews it before anything is buyable.</p>
                <div className="mt-2">
                  <StatusPill tone="destructive">policy.blocked · mandate_exceeded</StatusPill>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Bundle proposal</p>
                  <StatusPill tone="destructive">blocked</StatusPill>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {ITEMS.slice(0, 3).map((it) => (
                    <li key={it.name} className="flex items-center justify-between text-[13px]">
                      <span className="text-foreground">{it.name}</span>
                      <span className="font-mono text-muted-foreground">{formatPaise(it.price)}</span>
                    </li>
                  ))}
                  <li className="text-[12px] text-muted-foreground">+ 3 more lines</li>
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total · vendor list</span>
                  <span className="font-mono text-[14px] font-medium text-foreground">{formatPaise(TOTAL)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <Eyebrow>Policy gate</Eyebrow>
              <StatusPill tone="destructive">blocked</StatusPill>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">engagement 1 · blocked, nothing later evaluated</p>
            <ul className="mt-3 space-y-1.5">
              {RULES.map((r) => (
                <li key={r.name} className="flex items-center gap-2 text-[12px]">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      r.status === "passed" && "bg-positive",
                      r.status === "failed" && "bg-destructive",
                      r.status === "skipped" && "border border-muted-foreground/50",
                      r.status === "pending" && "bg-muted-foreground/30",
                    )}
                  />
                  <span className="text-foreground">{r.name}</span>
                  <span className={cn("ml-auto font-dm-mono text-[10px] uppercase tracking-[0.12em]", r.status === "failed" ? "text-destructive" : "text-muted-foreground")}>
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-destructive">determining rule</p>
              <p className="mt-1 text-[12px] font-medium text-foreground">Per-order cap</p>
              <p className="mt-1 text-[11px] text-muted-foreground">quote {formatPaise(TOTAL)} over buyer per-order max {formatPaise(2000000)} (BM-5520)</p>
            </div>
            <div className="mt-3">
              <StatusPill tone="destructive">mandate_exceeded</StatusPill>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Blocked — first failure wins · seven rules · precedence order · first failure wins</p>
          </Card>

          <Card className="md:col-span-2 xl:col-span-2">
            <div className="flex items-center justify-between">
              <Eyebrow>Storefront · live catalog</Eyebrow>
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">6 SKUs</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ITEMS.map((it) => (
                <div key={it.name} className="rounded-xl border border-border bg-card p-3">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted" />
                  <p className="mt-2 text-[13px] font-medium text-foreground truncate">{it.name}</p>
                  <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{it.sub}</p>
                  <p className="mt-1 font-mono text-[12px] text-foreground">{formatPaise(it.price)}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">vendor list · prices re-fetched at evaluation</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <Eyebrow>Buyer agent · catalog</Eyebrow>
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">fetched 0/6</span>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {ITEMS.map((it) => (
                <li key={it.name} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-foreground">{it.name}</span>
                  <span className="font-dm-mono text-muted-foreground truncate">{it.pid} · {it.sub}</span>
                  <span className="font-mono text-muted-foreground shrink-0">{formatPaise(it.price)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Cart</p>
                <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">0 items</span>
              </div>
              <p className="mt-1 font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">provisional</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {ITEMS.map((it) => (
                  <li key={it.name} className="flex items-center justify-between text-[12px]">
                    <span className="text-foreground">1 × {it.name}</span>
                    <span className="font-mono text-muted-foreground">{formatPaise(it.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total · provisional</span>
                <span className="font-mono text-[13px] font-medium text-foreground">{formatPaise(0)}</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-card p-3">
              <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Order summary</p>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-foreground">Quote Q-2417</span>
                <StatusPill tone="positive">authoritative</StatusPill>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total · locked 5 min</span>
                <span className="font-mono text-[13px] font-medium text-foreground">{formatPaise(0)}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Backend re-fetch — the authoritative price, not the cart’s.</p>
            </div>
          </Card>

          <Card>
            <Eyebrow>Mandates</Eyebrow>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">merchant mandate</p>
                  <p className="mt-1 font-mono text-[13px] text-foreground">MM-8841</p>
                </div>
                <StatusPill tone="positive">verified</StatusPill>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <p className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">buyer mandate</p>
                  <p className="mt-1 font-mono text-[13px] text-foreground">BM-5520</p>
                </div>
                <StatusPill tone="positive">verified</StatusPill>
              </div>
            </div>
          </Card>

          <Card>
            <Eyebrow>Checkout</Eyebrow>
            <p className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-[13px] leading-[1.5] text-muted-foreground">
              pending — The Buyer Agent places the order — zero human clicks.
            </p>
          </Card>

          <Card>
            <Eyebrow>Payment · test mode</Eyebrow>
            <div className="mt-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand animate-pulse" />
              <span className="font-dm-mono text-[11px] uppercase tracking-[0.12em] text-brand">awaiting authorization</span>
            </div>
            <p className="mt-2 text-[12px] leading-[1.5] text-muted-foreground">Razorpay test processor · simulated — no real money moves in this demo.</p>
          </Card>

          <Card className="md:col-span-2 xl:col-span-3">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>Audit log</Eyebrow>
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">append-only · demo ledger · whole section</span>
            </div>
            <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {AUDIT.map((e, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-[11px] text-foreground break-all">{e}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </main>
  );
}

// app/products/[slug]/BuyWithAgentButton.tsx — Runs the Buyer Agent on this SKU.
// One click opens the run: catalog read -> cart -> quote -> mandate -> Policy Gate
// -> test-mode capture + receipt. The dialog narrates real steps from the run.

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/lib/data/products";

const RULE_LABELS: Record<string, string> = {
  mandate_validity: "Mandate validity",
  category_whitelist: "Category whitelist",
  price_source_of_truth: "Price source-of-truth",
  margin_floor: "Margin floor",
  per_order_cap: "Per-order cap",
  rolling_daily_cap: "Rolling daily cap",
  velocity: "Velocity",
};

type BuyResult = {
  status: "captured" | "created" | "blocked" | "failed";
  totalPaise?: number;
  orderId?: string;
  razorpayOrderId?: string;
  paymentId?: string;
  receiptId?: string;
  receiptHash?: string | null;
  mandateId?: string;
  trace?: string[];
  message?: string;
  suggestions?: { id: string; slug: string; name: string; pricePaise: number }[];
  verdict?: {
    outcome: string;
    determiningRule?: string;
    reason?: string;
    rules: { rule: string; result: string }[];
  };
};

type StepState = "done" | "active" | "pending" | "failed" | "skipped";

export function BuyWithAgentButton({
  skuId,
  name,
  pricePaise,
  stock,
}: {
  skuId: string;
  name: string;
  pricePaise: number;
  stock: number;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BuyResult | null>(null);
  const [error, setError] = useState("");
  const [needsAuth, setNeedsAuth] = useState(false);
  const timerRef = useRef<number | null>(null);

  const steps = [
    "Read the catalog from the database",
    `Build cart · 1 × ${name}`,
    "Lock a 5-minute quote",
    "Verify the signed mandate",
    "Run the Policy Gate · 7 rules",
    "Capture payment · issue receipt",
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  async function run() {
    setPhase("running");
    setProgress(1);
    setResult(null);
    setError("");
    setNeedsAuth(false);

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(
      () => setProgress((p) => Math.min(p + 1, 5)),
      320,
    );

    try {
      const res = await fetch("/api/agent/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId, quantity: 1 }),
      });

      if (res.status === 401) {
        setNeedsAuth(true);
        setPhase("done");
        return;
      }

      const data = (await res.json().catch(() => null)) as BuyResult | null;
      if (!res.ok || !data) {
        setError(data?.message ?? `The run failed (HTTP ${res.status}).`);
        setPhase("done");
        return;
      }

      setResult(data);
      setPhase("done");
    } catch {
      setError("Network error — the run didn't reach the server. Try again.");
      setPhase("done");
    } finally {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setPhase("idle");
      setProgress(0);
      setResult(null);
      setError("");
      setNeedsAuth(false);
      void run();
    }
  }

  function stateFor(i: number): StepState {
    if (phase === "running") return i < progress ? "done" : i === progress ? "active" : "pending";
    if (phase !== "done") return "pending";
    if (needsAuth || error) return i < progress ? "done" : i === progress ? "failed" : "pending";
    if (!result) return "pending";
    if (result.status === "captured") return "done";
    if (result.status === "blocked") return i <= 3 ? "done" : i === 4 ? "failed" : "skipped";
    if (result.status === "created") return i <= 4 ? "done" : "failed";
    return i < progress ? "done" : "pending";
  }

  if (stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-md border border-border bg-muted px-4 text-sm font-medium text-muted-foreground sm:h-10 sm:w-auto sm:px-6"
      >
        Sold out
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="h-11 w-full rounded-md border-border bg-background text-sm font-medium hover:bg-muted sm:h-10 sm:w-auto sm:px-6"
          />
        }
      >
        Buy with agent
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Buyer agent · zero human clicks
          </DialogDescription>
          <DialogTitle className="text-[16px] font-medium">
            {name} — {formatPaise(pricePaise)}
          </DialogTitle>
        </DialogHeader>

        {/* The run, step by step */}
        <ol className="flex flex-col gap-2.5">
          {steps.map((label, i) => {
            const state = stateFor(i);
            return (
              <li key={label} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                    state === "done" && "border-positive/40 bg-positive/10 text-positive",
                    state === "active" && "border-brand/40 bg-brand/10 text-brand",
                    state === "failed" && "border-destructive/40 bg-destructive/10 text-destructive",
                    state === "skipped" && "border-border text-muted-foreground/40",
                    state === "pending" && "border-border text-muted-foreground/40",
                  )}
                >
                  {state === "done" && <Check className="size-3" strokeWidth={2.5} />}
                  {state === "active" && <Loader2 className="size-3 animate-spin" />}
                  {state === "failed" && <X className="size-3" strokeWidth={2.5} />}
                </span>
                <span
                  className={cn(
                    "text-[13px] leading-snug",
                    state === "pending" && "text-muted-foreground/60",
                    state === "skipped" && "text-muted-foreground/50 line-through decoration-border",
                    state === "failed" && "font-medium text-destructive",
                    (state === "done" || state === "active") && "text-foreground",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Outcome */}
        {result?.status === "captured" && (
          <div className="rounded-xl border border-positive/30 bg-positive/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-positive">
                Order captured · test mode
              </span>
              <span className="font-mono text-[13px] tabular-nums text-foreground">
                {formatPaise(result.totalPaise ?? 0)}
              </span>
            </div>
            <dl className="mt-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-4">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">Order</dt>
                <dd className="font-mono text-[11.5px] text-foreground">{result.orderId}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">Payment</dt>
                <dd className="flex items-center gap-2 font-mono text-[11.5px] text-foreground">
                  {result.paymentId}
                  <span className="rounded-sm border border-border px-1 py-px font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    test
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">Receipt</dt>
                <dd className="font-mono text-[11.5px] text-foreground">{result.receiptId}</dd>
              </div>
              {result.receiptHash && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">Hash</dt>
                  <dd className="truncate font-mono text-[11px] text-foreground/60">#{result.receiptHash.slice(0, 20)}…</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {result?.status === "created" && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Order created · capture pending
            </p>
            <p className="mt-2 font-mono text-[11.5px] text-foreground">{result.orderId}</p>
            {result.message && <p className="mt-1 text-[12px] text-muted-foreground">{result.message}</p>}
          </div>
        )}

        {result?.status === "blocked" && (
          <>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive">
                Blocked by the Policy Gate
              </span>
              <p className="mt-2 text-[13.5px] font-medium text-foreground">
                {RULE_LABELS[result.verdict?.determiningRule ?? ""] ?? "Policy rule"}
              </p>
              {result.verdict?.reason && (
                <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">{result.verdict.reason}</p>
              )}
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                Receipt {result.receiptId} · nothing was charged
              </p>
            </div>
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Cheaper, in-stock alternatives
                </p>
                <ul className="mt-2 flex flex-col">
                  {result.suggestions.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/products/${s.slug}`}
                        className="flex items-center justify-between gap-4 border-t border-border py-2.5 text-[13px] text-foreground transition-colors first:border-t-0 hover:text-brand max-sm:py-3"
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted-foreground">
                          {formatPaise(s.pricePaise)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {needsAuth && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-[13.5px] font-medium text-foreground">Sign in to run the buyer agent</p>
            <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
              The agent acts as you: it needs a session, a signed mandate, and a receipt trail in your name.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-[13px] leading-[1.5] text-destructive">{error}</p>
          </div>
        )}

        {/* Run log — real facts from the run */}
        {result?.trace && result.trace.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Run log</p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {result.trace.map((line, i) => (
                <li key={i} className="font-mono text-[10.5px] leading-[1.5] text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground max-sm:text-center">
            Test mode · no real money moves
          </p>
          {needsAuth ? (
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
              className="h-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90 sm:h-7"
            >
              Sign in
            </Button>
          ) : (
            phase === "done" && (
              <Button variant="outline" size="sm" className="h-11 rounded-full sm:h-7" onClick={() => void run()}>
                Run again
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

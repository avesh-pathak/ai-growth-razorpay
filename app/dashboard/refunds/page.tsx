// app/dashboard/refunds/page.tsx — Refunds & disputes (real API)

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPaise } from "@/lib/data/products";

type Refund = {
  id: string;
  created_at: string;
  action: string;
  entity_id: string;
  payload: {
    refundId: string;
    razorpayRefundId: string;
    orderId: string;
    amountPaise: number;
    reason: string;
    originalAmount: number;
    isFull: boolean;
    linkedReceiptId: string | null;
  };
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("customer_request");
  const [approved, setApproved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/refunds");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "load failed");
      setRefunds(data.refunds ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/refunds");
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.message ?? "load failed");
        setRefunds(data.refunds ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleRefund(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult("");
    setError("");
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          amountPaise: Math.round(Number(amount) * 100),
          reason,
          approved,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "refund failed");
      } else {
        setResult(`Refund ${data.refundId} created (${data.status}) — ${formatPaise(data.amountPaise)}`);
        setOrderId("");
        setAmount("");
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <h1 className="text-2xl font-semibold mb-6">Refunds & disputes</h1>

        <Card className="mb-8">
          <CardHeader><CardTitle>Issue a refund</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleRefund} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Order ID</label>
                <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="TXN-..." required className="h-11 sm:h-9" />
              </div>
              <div className="grid gap-2">
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Amount (INR)</label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="h-11 sm:h-9" />
              </div>
              <div className="grid gap-2">
                <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Reason</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} className="h-11 sm:h-9" />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={approved} onChange={(e) => setApproved(e.target.checked)} />
                  Admin approval (&gt;50%)
                </label>
                <Button type="submit" disabled={submitting} className="h-11 sm:h-9">
                  {submitting ? "Processing…" : "Issue refund"}
                </Button>
              </div>
            </form>
            {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}
            {result && <p className="mt-4 text-[13px] text-positive">{result}</p>}
            <p className="mt-4 text-[12px] text-muted-foreground">
              Refunds above 50% of the original amount require admin approval. Refunds are gate-checked and recorded as a linked audit pair (refund.created → original receipt).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Refund history</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2" role="status">
                <div className="space-y-2" aria-hidden>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="mt-2 h-3 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-2/3" />
                    </div>
                  ))}
                </div>
                <span className="sr-only">Loading refunds…</span>
              </div>
            ) : refunds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No refunds yet.</p>
            ) : (
              <div className="space-y-2">
                {refunds.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[13px]">{r.payload.refundId}</span>
                      <Badge variant={r.payload.isFull ? "destructive" : "secondary"}>
                        {r.payload.isFull ? "full refund" : "partial refund"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                      {formatPaise(r.payload.amountPaise)} of {formatPaise(r.payload.originalAmount)} · order {r.payload.orderId} · {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Reason: {r.payload.reason} · linked receipt {r.payload.linkedReceiptId ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
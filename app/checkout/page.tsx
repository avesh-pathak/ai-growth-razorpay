// app/checkout/page.tsx — Real checkout: quote → Policy Gate → Razorpay (test) → receipt

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { formatPaise } from "@/lib/data/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

type Suggestion = { id: string; slug: string; name: string; pricePaise: number };

type CheckoutResult = {
  status: "created" | "blocked" | "failed";
  orderId?: string;
  receiptId?: string;
  totalPaise?: number;
  amountPaise?: number;
  verdict?: { outcome: string; determiningRule?: string; reason?: string; rules?: { rule: string; result: string }[] };
  suggestions?: { forSku: string; alternatives: Suggestion[] }[] | Suggestion[];
  message?: string;
};

export default function CheckoutPage() {
  const cart = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"review" | "result">("review");
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [captured, setCaptured] = useState<{ receiptId: string; paymentId: string; totalPaise: number } | null>(null);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (cart.items.length === 0) return;
    setLoading(true);
    setError("");
    try {
      // 1. Authoritative quote (prices re-fetched, 5-min TTL)
      const quoteRes = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skuIds: cart.items.map((i) => i.product.id),
          quantities: cart.items.map((i) => i.qty),
        }),
      });
      const quote = await quoteRes.json();
      if (!quoteRes.ok) {
        setError(quote?.message ?? "Could not create quote. Please retry.");
        setLoading(false);
        return;
      }

      // 2. Gate-guarded checkout (mandate + Policy Gate + Razorpay order)
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.quoteId, idempotencyKey: crypto.randomUUID() }),
      });
      const checkoutData = (await checkoutRes.json()) as CheckoutResult;
      if (checkoutData.status === "blocked") {
        setResult(checkoutData);
        setStep("result");
        setLoading(false);
        return;
      }
      if (!checkoutRes.ok || checkoutData.status === "failed") {
        setError(checkoutData.message ?? "Checkout failed. Please retry.");
        setLoading(false);
        return;
      }

      // 3. Simulate capture in test mode (same path a webhook would use)
      const completeRes = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: checkoutData.orderId }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        setError(completeData?.message ?? "Capture failed.");
        setLoading(false);
        return;
      }
      setCaptured({ receiptId: completeData.receiptId, paymentId: completeData.paymentId, totalPaise: completeData.totalPaise });
      setResult(checkoutData);
      setStep("result");
      cart.clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "result" && result?.status === "blocked") {
    const flatSuggestions: Suggestion[] = Array.isArray(result.suggestions)
      ? (result.suggestions as { alternatives?: Suggestion[] }[]).flatMap((s) => (s.alternatives ? s.alternatives : [s as unknown as Suggestion]))
      : [];
    return (
      <main className="min-h-[calc(100dvh-4.5rem)]">
        <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-destructive">Blocked by the Policy Gate</p>
            <h1 className="mt-2 text-xl font-semibold text-foreground">
              {result.verdict?.determiningRule ?? "Policy rule"}
            </h1>
            {result.verdict?.reason && <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">{result.verdict.reason}</p>}
            <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">Receipt {result.receiptId} · nothing was charged</p>
          </div>

          {flatSuggestions.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Cheaper, in-stock alternatives</CardTitle></CardHeader>
              <CardContent>
                <ul className="flex flex-col">
                  {flatSuggestions.map((s) => (
                    <li key={s.id}>
                      <Link href={`/products/${s.slug}`} className="flex items-center justify-between gap-4 border-t border-border py-3 text-[13px] text-foreground transition-colors first:border-t-0 hover:text-brand">
                        <span className="truncate">{s.name}</span>
                        <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted-foreground">{formatPaise(s.pricePaise)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="h-11 sm:h-8" onClick={() => { setStep("review"); setResult(null); }}>
              Back to cart
            </Button>
            <Button className="h-11 sm:h-8" onClick={() => router.push("/products")}>Continue shopping</Button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "result" && captured) {
    return (
      <main className="min-h-[calc(100dvh-4.5rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-positive">Payment successful</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Your order has been placed and captured in test mode.</p>
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-left font-mono text-[11.5px]">
              <div className="flex justify-between"><span className="text-muted-foreground">ORDER</span><span>{result?.orderId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">PAYMENT</span><span>{captured.paymentId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">RECEIPT</span><span>{captured.receiptId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">TOTAL</span><span>{formatPaise(captured.totalPaise)}</span></div>
            </div>
            <Button className="h-11 w-full sm:h-8" onClick={() => router.push("/products")}>Continue shopping</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Order review</CardTitle></CardHeader>
            <CardContent>
              {cart.items.length === 0 ? (
                <p className="text-muted-foreground">Your cart is empty. <Link href="/products" className="text-brand hover:underline">Browse the catalog</Link></p>
              ) : (
                <Table className="table-cards">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell data-label="Item" className="font-medium">{item.product.name}</TableCell>
                        <TableCell data-label="Qty">{item.qty}</TableCell>
                        <TableCell data-label="Price" className="font-mono">{formatPaise(item.product.pricePaise)}</TableCell>
                        <TableCell data-label="Total" className="font-mono">{formatPaise(item.product.pricePaise * item.qty)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell />
                      <TableCell className="font-mono">{formatPaise(cart.subtotalPaise)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">Test mode — no real money. The Policy Gate runs before any money moves.</p>
              {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[13px] text-destructive">{error}</p>}
              <Button
                className="h-11 w-full sm:h-8"
                disabled={cart.items.length === 0 || loading}
                onClick={handleCheckout}
              >
                {loading ? "Processing…" : "Pay now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
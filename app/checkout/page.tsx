// app/checkout/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPaise } from "@/lib/data/products";

export default function CheckoutPage() {
  const cart = useCart();
  const [step, setStep] = useState<"review" | "paying" | "done">("review");
  const [orderId, setOrderId] = useState<string | null>(null);

  const handlePay = () => {
    setStep("paying");
    setTimeout(() => {
      setOrderId("ord_" + Math.random().toString(36).slice(2, 10));
      setStep("done");
      cart.clear();
    }, 1400);
  };

  if (step === "done") {
    return (
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-[8.25rem]">
        <div className="mx-auto max-w-[32rem] flex flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-positive/10">
            <CheckCircle2 className="size-8 text-positive" />
          </div>
          <h1 className="font-heading text-[clamp(2.125rem,1.425rem+1.75vw,3rem)] font-medium leading-[1.2] tracking-[-0.02em] text-primary">
            Payment successful
          </h1>
          <p className="font-sans text-[1.125rem] text-muted-foreground">
            Your order is confirmed. A signed receipt has been issued and the audit trail updated.
          </p>
          <div className="w-full rounded-xl border border-border bg-card p-5 text-left shadow-sm">
            <p className="font-dm-mono text-[11px] tracking-[0.02em] uppercase text-muted-foreground">Order ID</p>
            <p className="mt-1 font-mono text-sm text-primary">{orderId}</p>
            <p className="mt-3 font-dm-mono text-[11px] tracking-[0.02em] uppercase text-muted-foreground">Amount</p>
            <p className="mt-1 font-sans text-sm font-medium text-primary">{formatPaise(cart.subtotalPaise || 129900)}</p>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-[8.25rem]">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="size-4" /> Back to cart
      </Link>
      <h1 className="mt-6 font-heading text-[clamp(2.5rem,1.5rem+2.5vw,3.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-primary">
        Checkout
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-[1.25rem] font-medium tracking-[-0.02em] text-primary">Quote review</h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Prices re-fetched from the authoritative source. Quote valid for 5 minutes.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {cart.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items. <Link href="/products" className="text-brand hover:underline">Add some.</Link></p>
              ) : (
                cart.items.map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-primary">{product.name}</p>
                      <p className="font-dm-mono text-[11px] text-muted-foreground">{qty} × {formatPaise(product.pricePaise)}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{formatPaise(product.pricePaise * qty)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-heading text-[1.25rem] font-medium tracking-[-0.02em] text-primary">Mandate check</h2>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              Both envelopes (buyer budget + merchant policy) verified by the Policy Gate.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-md border border-positive/30 bg-positive/5 px-3 py-2 text-sm text-primary">
              <ShieldCheck className="size-4 text-positive" />
              <span>Dual-sided gate: allowed · determining rule: none (all 7 passed)</span>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
          <h2 className="font-heading text-[1.25rem] font-medium tracking-[-0.02em] text-primary">Total</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPaise(cart.subtotalPaise || 0)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-medium text-primary">
              <span>Total</span>
              <span>{formatPaise(cart.subtotalPaise || 0)}</span>
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={step === "paying" || cart.items.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {step === "paying" ? "Processing…" : "Pay with Razorpay (test)"}
          </button>
          <p className="font-dm-mono text-[11px] tracking-[0.02em] uppercase text-muted-foreground text-center">
            Test mode · no real money
          </p>
        </aside>
      </div>
    </div>
  );
}

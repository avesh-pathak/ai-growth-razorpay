// app/cart/page.tsx
"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPaise } from "@/lib/data/products";

export default function CartPage() {
  const cart = useCart();

  if (cart.items.length === 0) {
    return (
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-14 sm:py-[8.25rem]">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-7 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-[clamp(2.125rem,1.425rem+1.75vw,3rem)] font-medium leading-[1.2] tracking-[-0.02em] text-primary">
            Your cart is empty
          </h1>
          <p className="font-sans text-[1.125rem] text-muted-foreground">Add something from the catalog to get started.</p>
          <Link
            href="/products"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 sm:h-9"
          >
            Browse products <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-14 sm:py-[8.25rem]">
      <h1 className="font-heading text-[clamp(2.5rem,1.5rem+2.5vw,3.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-primary">
        Your cart
      </h1>
      <p className="mt-2 font-sans text-[1.125rem] text-muted-foreground">
        {cart.count} item{cart.count === 1 ? "" : "s"} · review before checkout.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cart.items.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.name} className="size-20 shrink-0 rounded-md object-cover bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-dm-mono text-[11px] tracking-[0.02em] uppercase text-muted-foreground">{product.category}</p>
                    <h3 className="font-heading text-[1rem] font-medium tracking-[-0.02em] text-primary">{product.name}</h3>
                  </div>
                  <button
                    onClick={() => cart.remove(product.id)}
                    className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive sm:size-4"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-md border border-border">
                    <button onClick={() => cart.setQty(product.id, qty - 1)} className="flex h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-primary sm:h-auto sm:min-w-0 sm:px-2 sm:py-1">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-[2ch] text-center text-sm font-medium">{qty}</span>
                    <button onClick={() => cart.setQty(product.id, qty + 1)} className="flex h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-primary sm:h-auto sm:min-w-0 sm:px-2 sm:py-1">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-sans text-sm font-medium text-primary">
                    {formatPaise(product.pricePaise * qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
          <h2 className="font-heading text-[1.25rem] font-medium tracking-[-0.02em] text-primary">Order summary</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPaise(cart.subtotalPaise)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-medium text-primary">
              <span>Total</span>
              <span>{formatPaise(cart.subtotalPaise)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 sm:h-10"
          >
            Proceed to checkout <ArrowRight className="size-4" />
          </Link>
          <p className="font-dm-mono text-[11px] tracking-[0.02em] uppercase text-muted-foreground text-center">
            Test mode · no real money
          </p>
        </aside>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useCart, type CartProduct } from "@/lib/cart";

export function AddToCartButton({ product }: { product: CartProduct }) {
  const cart = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        cart.add(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-[0.96] sm:h-10 sm:w-auto sm:px-6"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}

"use client";
import { useCart } from "@/lib/cart";

export function AddToCartButton({ productId }: { productId: string }) {
  const cart = useCart();
  return (
    <button
      onClick={() => cart.add(productId)}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-[0.96] sm:w-auto sm:px-6"
    >
      Add to cart
    </button>
  );
}

// lib/cart.tsx — client-side cart state (demo; server persistence optional).
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { PRODUCTS, type Product } from "@/lib/data/products";

export type CartLine = { productId: string; qty: number };

type CartState = {
  lines: CartLine[];
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalPaise: number;
  items: { product: Product; qty: number }[];
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((productId: string, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { productId, qty }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, qty } : l));
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const items = lines
    .map((l) => {
      const product = PRODUCTS.find((p) => p.id === l.productId);
      return product ? { product, qty: l.qty } : null;
    })
    .filter(Boolean) as { product: Product; qty: number }[];

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotalPaise = items.reduce((s, i) => s + i.product.pricePaise * i.qty, 0);

  return (
    <CartContext.Provider value={{ lines, add, remove, setQty, clear, count, subtotalPaise, items }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

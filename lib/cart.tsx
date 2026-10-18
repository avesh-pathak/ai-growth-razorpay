// lib/cart.tsx — client-side cart state.
// Lines carry a product snapshot captured at add-time (from the DB-backed catalog),
// so display never depends on hardcoded data. Checkout re-quotes against the DB.
"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  pricePaise: number;
  image: string;
};

export type CartLine = { product: CartProduct; qty: number };

type CartState = {
  lines: CartLine[];
  add: (product: CartProduct, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotalPaise: number;
  items: CartLine[];
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const add = useCallback((product: CartProduct, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { product, qty }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => l.product.id !== productId);
      return prev.map((l) => (l.product.id === productId ? { ...l, qty } : l));
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotalPaise = lines.reduce((s, l) => s + l.product.pricePaise * l.qty, 0);

  return (
    <CartContext.Provider
      value={{ lines, add, remove, setQty, clear, count, subtotalPaise, items: lines }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

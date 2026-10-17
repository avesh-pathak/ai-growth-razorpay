"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PRODUCTS, CATEGORIES } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase()) || p.description.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <div className="max-w-frame mx-auto w-full px-6 sm:px-8 lg:px-12 py-24 md:py-32">
      <div className="flex flex-col gap-4 max-w-[39rem]">
        <h1 className="font-heading text-[clamp(2.5rem,1.5rem+2.5vw,3.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-foreground">
          All products
        </h1>
        <p className="text-[1.125rem] leading-[1.5] text-muted-foreground">
          {PRODUCTS.length} SKUs across {CATEGORIES.length - 1} categories. Agent-readable, quote-first, receipt-backed.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9 sm:w-64"
          />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-[1.125rem] text-muted-foreground">No products match your filters.</p>
        </div>
      )}
    </div>
  );
}

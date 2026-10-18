// app/products/page.tsx — Storefront catalog (DB-backed)

"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/lib/data/products";

type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  pricePaise: number;
  stock: number;
  image: string | null;
  badge: string | null;
  rating: number;
  reviews: number;
};

function CatalogSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-3">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function Catalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The URL is the category state (shareable, survives back/forward, drives header links).
  const category = searchParams.get("category") ?? "All";

  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/catalog?full=true");
        if (!res.ok) throw new Error(`catalog read failed (${res.status})`);
        const data = await res.json();
        if (!cancelled) setItems((data.items ?? []) as CatalogItem[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "catalog unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set((items ?? []).map((i) => i.category)))],
    [items],
  );

  const filtered = useMemo(() => {
    return (items ?? []).filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.subcategory ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, category, search]);

  function setCategory(next: string) {
    router.replace(next === "All" ? "/products" : `/products?category=${encodeURIComponent(next)}`, {
      scroll: false,
    });
  }

  return (
    <main id="main" className="min-h-screen">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8 sm:py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Catalog · live from the database
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            The catalog agents read
          </h1>
          {items && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {filtered.length} of {items.length} SKUs
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 max-w-full border-input bg-background px-3.5 text-[16px] sm:h-9 sm:max-w-xs sm:text-[14px]"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={cn(
                  "flex min-h-11 items-center rounded-full border px-4 text-[13px] transition-colors sm:min-h-9",
                  category === cat
                    ? "border-foreground/80 bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {error ? (
          <p className="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13.5px] text-destructive">
            {error} — refresh to try again.
          </p>
        ) : items === null ? (
          <CatalogSkeleton />
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-[14px] font-medium text-foreground">Nothing matches your search</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Try another search, or clear the filter to see all {items.length} SKUs.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image ?? ""}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  {p.badge && (
                    <span className="absolute left-2 top-2 rounded-sm border border-border bg-card/95 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-foreground">
                      {p.badge}
                    </span>
                  )}
                  {p.stock <= 0 && (
                    <span className="absolute right-2 top-2 rounded-sm border border-destructive/40 bg-card/95 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-destructive">
                      Sold out
                    </span>
                  )}
                </div>
                <p className="mt-3 truncate text-[14px] font-medium text-foreground">{p.name}</p>
                <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {p.category}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] tabular-nums text-foreground">
                    {formatPaise(p.pricePaise)}
                  </span>
                  <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">★ {p.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen">
          <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8 sm:py-12">
            <CatalogSkeleton />
          </div>
        </main>
      }
    >
      <Catalog />
    </Suspense>
  );
}

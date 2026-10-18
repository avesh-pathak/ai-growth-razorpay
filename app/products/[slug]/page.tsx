// app/products/[slug]/page.tsx — Product detail (DB-backed)

export const instant = false;

import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchCatalog } from "@/lib/catalog";
import { formatPaise } from "@/lib/data/products";
import { AddToCartButton } from "./AddToCartButton";
import { BuyWithAgentButton } from "./BuyWithAgentButton";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await fetchCatalog();
  const product = catalog.find((p) => p.slug === slug);
  if (!product) notFound();

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    pricePaise: product.pricePaise,
    image: product.image ?? "",
  };

  return (
    <main id="main" className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8 sm:py-12">
        <Link
          href="/products"
          className="inline-flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground max-sm:min-h-11"
        >
          ← Catalog
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
          {/* Image */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
            <div className="aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image ?? ""} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {product.badge && (
              <span className="absolute left-3 top-3 rounded-sm border border-border bg-card/95 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-foreground">
                {product.badge}
              </span>
            )}
          </div>

          {/* Detail */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {product.category}
              {product.subcategory ? ` · ${product.subcategory}` : ""}
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
              {product.name}
            </h1>

            {product.description && (
              <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.65] text-muted-foreground">{product.description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-mono text-[1.5rem] font-medium tabular-nums tracking-[-0.01em] text-foreground">
                {formatPaise(product.pricePaise)}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                <span
                  className={
                    product.stock > 0
                      ? "size-1.5 rounded-full bg-positive"
                      : "size-1.5 rounded-full bg-destructive"
                  }
                />
                {product.stock > 0 ? `In stock · ${product.stock} available` : "Sold out"}
              </span>
            </div>

            {/* Spec ledger */}
            <dl className="mt-8 divide-y divide-border border-y border-border">
              <div className="flex items-center justify-between gap-6 py-3">
                <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Rating</dt>
                <dd className="text-[14px] tabular-nums text-foreground">
                  {product.rating.toFixed(1)} · {product.reviews} reviews
                </dd>
              </div>
              {Object.entries(product.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-6 py-3">
                  <dt className="font-mono text-[11px] capitalize uppercase tracking-[0.14em] text-muted-foreground">
                    {key}
                  </dt>
                  <dd className="text-right text-[14px] text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <AddToCartButton product={cartProduct} />
              <BuyWithAgentButton
                skuId={product.id}
                name={product.name}
                pricePaise={product.pricePaise}
                stock={product.stock}
              />
            </div>

            <p className="mt-4 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />
              Agent purchases pass the Policy Gate before any money moves
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

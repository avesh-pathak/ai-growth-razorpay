// app/products/[slug]/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Package, ShieldCheck } from "lucide-react";
import { getProduct, formatPaise } from "@/lib/data/products";
import { AddToCartButton } from "./AddToCartButton";

async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-[8.25rem]">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="size-4" /> Back to catalog
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="font-dm-mono text-[12px] leading-4 tracking-[0.02em] uppercase text-muted-foreground">
              {product.category} · {product.subcategory}
            </p>
            <h1 className="font-heading text-[clamp(2.125rem,1.425rem+1.75vw,3rem)] font-medium leading-[1.2] tracking-[-0.02em] text-primary">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="size-4 fill-brand text-brand" />
              <span className="text-sm">{product.rating}</span>
              <span className="text-sm">({product.reviews} reviews)</span>
            </div>
          </div>

          <p className="font-sans text-[1.125rem] leading-[1.5] font-normal text-muted-foreground">
            {product.description}
          </p>

          <div className="flex items-baseline gap-3">
            <span className="font-heading text-[2rem] font-medium tracking-[-0.02em] text-primary">
              {formatPaise(product.pricePaise)}
            </span>
            <span className="font-dm-mono text-[12px] text-muted-foreground">
              incl. taxes · {product.stock} in stock
            </span>
          </div>

          <AddToCartButton productId={product.id} />

          <div className="grid grid-cols-2 gap-3 pt-4">
            {Object.entries(product.attributes).map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-card p-3">
                <p className="font-dm-mono text-[10px] tracking-[0.02em] uppercase text-muted-foreground">{k}</p>
                <p className="mt-1 text-sm font-medium text-primary">{v}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm text-primary">
              <ShieldCheck className="size-4 text-positive" />
              <span>Margin-protected pricing — every line gate-checked.</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary">
              <Package className="size-4 text-muted-foreground" />
              <span>Ships in 24h · free returns within 30 days.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="max-w-frame mx-auto w-full px-4 py-24 text-muted-foreground">Loading…</div>}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

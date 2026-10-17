"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPaise, type Product } from "@/lib/data/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="group gap-3 p-3 transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          {product.badge && (
            <Badge className="absolute left-2 top-2" variant="secondary">
              {product.badge}
            </Badge>
          )}
          {product.stock < 15 && (
            <Badge className="absolute right-2 top-2" variant="destructive">
              Low stock
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-col gap-1 p-0">
        <p className="text-[11px] text-muted-foreground">{product.category}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-[1rem] font-medium leading-[1.2] tracking-[-0.02em] text-foreground transition-colors group-hover:text-muted-foreground">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Star className="size-3 fill-brand text-brand" />
          <span className="text-[12px]">{product.rating} ({product.reviews})</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[1rem] font-medium text-foreground">{formatPaise(product.pricePaise)}</span>
          <button
            className="inline-flex h-9 items-center gap-1 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground shadow-sm transition-opacity hover:opacity-90 active:scale-[0.96]"
          >
            Add
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

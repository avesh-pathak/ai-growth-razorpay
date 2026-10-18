// lib/catalog.ts — DB-backed catalog reader (server-only)
// Maps products+skus rows to a single flat CatalogItem used by pages and APIs.

import { createAdminClient } from "@/lib/supabase/admin";

export type CatalogItem = {
  id: string; // sku id
  productId: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  pricePaise: number;
  costPaise: number;
  marginPct: number;
  stock: number;
  rating: number;
  reviews: number;
  image: string | null;
  badge: string | null;
  attributes: Record<string, string>;
};

type SkuRow = {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  variant_attrs: Record<string, string> | null;
  cost_price_paise: number;
  list_price_paise: number;
  margin_pct: number | string;
  stock: number;
  rating: number | string;
  reviews: number;
  image_url: string | null;
  badge: string | null;
  products: { name: string; category: string; subcategory: string | null; description: string | null } | null;
};

export function mapSkuRow(row: SkuRow): CatalogItem {
  return {
    id: row.id,
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    description: row.products?.description ?? null,
    category: row.products?.category ?? "Uncategorized",
    subcategory: row.products?.subcategory ?? null,
    pricePaise: row.list_price_paise,
    costPaise: row.cost_price_paise,
    marginPct: Number(row.margin_pct),
    stock: row.stock,
    rating: Number(row.rating),
    reviews: row.reviews,
    image: row.image_url,
    badge: row.badge,
    attributes: row.variant_attrs ?? {},
  };
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select(
      "id, product_id, name, slug, variant_attrs, cost_price_paise, list_price_paise, margin_pct, stock, rating, reviews, image_url, badge, products(name, category, subcategory, description)",
    )
    .order("name");

  if (error) throw new Error(`catalog read failed: ${error.message}`);
  return ((data ?? []) as unknown as SkuRow[]).map(mapSkuRow);
}

export function catalogMap(items: CatalogItem[]) {
  return new Map(
    items.map((i) => [
      i.id,
      { pricePaise: i.pricePaise, costPaise: i.costPaise, category: i.category, stock: i.stock },
    ]),
  );
}

export function filterCatalog(
  items: CatalogItem[],
  opts: { category?: string | null; q?: string | null; slug?: string | null },
): CatalogItem[] {
  let filtered = items;
  if (opts.category && opts.category !== "All") {
    filtered = filtered.filter((i) => i.category === opts.category);
  }
  if (opts.q) {
    const lower = opts.q.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(lower) ||
        (i.description ?? "").toLowerCase().includes(lower) ||
        i.category.toLowerCase().includes(lower),
    );
  }
  if (opts.slug) {
    filtered = filtered.filter((i) => i.slug === opts.slug);
  }
  return filtered;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

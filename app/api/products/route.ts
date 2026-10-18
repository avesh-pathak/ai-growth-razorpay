// app/api/products/route.ts — Merchant product CRUD (list + create)
// Reads are public; writes require an authenticated owner/admin profile.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile, isMerchant } from "@/lib/auth";
import { fetchCatalog, slugify } from "@/lib/catalog";

const CATEGORIES = ["Brewers", "Grinders", "Kettles", "Accessories", "Beans"];

export async function GET() {
  try {
    const items = await fetchCatalog();
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: "catalog_unavailable", message: err instanceof Error ? err.message : "read failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const profile = await getSessionProfile();
  if (!isMerchant(profile)) {
    return NextResponse.json({ error: "forbidden", message: "merchant role required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_request", message: "invalid JSON body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "");
  const description = String(body.description ?? "").trim();
  const pricePaise = Math.round(Number(body.pricePaise));
  const costPaise = Math.round(Number(body.costPaise));
  const stock = Math.max(0, Math.round(Number(body.stock ?? 0)));

  if (name.length < 2) {
    return NextResponse.json({ error: "invalid_request", message: "name is required" }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "invalid_request", message: `category must be one of ${CATEGORIES.join(", ")}` }, { status: 400 });
  }
  if (!Number.isFinite(pricePaise) || pricePaise <= 0) {
    return NextResponse.json({ error: "invalid_request", message: "price must be positive" }, { status: 400 });
  }
  if (!Number.isFinite(costPaise) || costPaise < 0 || costPaise >= pricePaise) {
    return NextResponse.json({ error: "invalid_request", message: "cost must be >= 0 and below price" }, { status: 400 });
  }

  const marginPct = Math.round(((pricePaise - costPaise) / pricePaise) * 100 * 100) / 100;
  const id = `p${Date.now()}`;
  const supabase = createAdminClient();

  // Ensure a unique slug
  let slug = slugify(name) || id;
  const { data: clash } = await supabase.from("skus").select("id").eq("slug", slug).maybeSingle();
  if (clash) slug = `${slug}-${id.slice(-4)}`;

  const { error: productError } = await supabase.from("products").insert({
    id,
    name,
    brand: "Kindred Coffee Supply",
    description: description || null,
    category,
    subcategory: null,
  });
  if (productError) {
    return NextResponse.json({ error: "db_error", message: productError.message }, { status: 500 });
  }

  const { error: skuError } = await supabase.from("skus").insert({
    id,
    product_id: id,
    name,
    slug,
    variant_attrs: {},
    cost_price_paise: costPaise,
    list_price_paise: pricePaise,
    margin_pct: marginPct,
    stock,
    image_url: `https://picsum.photos/seed/${slug}/640/640`,
    tags: [],
  });
  if (skuError) {
    await supabase.from("products").delete().eq("id", id);
    return NextResponse.json({ error: "db_error", message: skuError.message }, { status: 500 });
  }

  const items = await fetchCatalog();
  return NextResponse.json({ item: items.find((i) => i.id === id) ?? null }, { status: 201 });
}

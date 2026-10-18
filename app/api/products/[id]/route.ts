// app/api/products/[id]/route.ts — Merchant product update/delete

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile, isMerchant } from "@/lib/auth";
import { fetchCatalog } from "@/lib/catalog";

const CATEGORIES = ["Brewers", "Grinders", "Kettles", "Accessories", "Beans"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!isMerchant(profile)) {
    return NextResponse.json({ error: "forbidden", message: "merchant role required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_request", message: "invalid JSON body" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: sku, error: readError } = await supabase.from("skus").select("*").eq("id", id).maybeSingle();
  if (readError || !sku) {
    return NextResponse.json({ error: "not_found", message: "product not found" }, { status: 404 });
  }

  const skuUpdate: Record<string, unknown> = {};
  const productUpdate: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "invalid_request", message: "name too short" }, { status: 400 });
    }
    skuUpdate.name = name;
    productUpdate.name = name;
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(String(body.category))) {
      return NextResponse.json({ error: "invalid_request", message: "invalid category" }, { status: 400 });
    }
    productUpdate.category = String(body.category);
  }
  if (body.description !== undefined) {
    productUpdate.description = String(body.description).trim() || null;
  }
  if (body.stock !== undefined) {
    const stock = Math.max(0, Math.round(Number(body.stock)));
    if (!Number.isFinite(stock)) {
      return NextResponse.json({ error: "invalid_request", message: "invalid stock" }, { status: 400 });
    }
    skuUpdate.stock = stock;
  }

  const pricePaise = body.pricePaise !== undefined ? Math.round(Number(body.pricePaise)) : sku.list_price_paise;
  const costPaise = body.costPaise !== undefined ? Math.round(Number(body.costPaise)) : sku.cost_price_paise;
  if (body.pricePaise !== undefined || body.costPaise !== undefined) {
    if (!Number.isFinite(pricePaise) || pricePaise <= 0) {
      return NextResponse.json({ error: "invalid_request", message: "price must be positive" }, { status: 400 });
    }
    if (!Number.isFinite(costPaise) || costPaise < 0 || costPaise >= pricePaise) {
      return NextResponse.json({ error: "invalid_request", message: "cost must be below price" }, { status: 400 });
    }
    skuUpdate.list_price_paise = pricePaise;
    skuUpdate.cost_price_paise = costPaise;
    skuUpdate.margin_pct = Math.round(((pricePaise - costPaise) / pricePaise) * 100 * 100) / 100;
  }

  skuUpdate.updated_at = new Date().toISOString();

  const { error: skuError } = await supabase.from("skus").update(skuUpdate).eq("id", id);
  if (skuError) {
    return NextResponse.json({ error: "db_error", message: skuError.message }, { status: 500 });
  }

  if (Object.keys(productUpdate).length > 0) {
    productUpdate.updated_at = new Date().toISOString();
    const { error: productError } = await supabase.from("products").update(productUpdate).eq("id", sku.product_id);
    if (productError) {
      return NextResponse.json({ error: "db_error", message: productError.message }, { status: 500 });
    }
  }

  const items = await fetchCatalog();
  return NextResponse.json({ item: items.find((i) => i.id === id) ?? null });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getSessionProfile();
  if (!isMerchant(profile)) {
    return NextResponse.json({ error: "forbidden", message: "merchant role required" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: sku } = await supabase.from("skus").select("product_id").eq("id", id).maybeSingle();
  if (!sku) {
    return NextResponse.json({ error: "not_found", message: "product not found" }, { status: 404 });
  }

  // Deleting the product cascades to its SKU
  const { error } = await supabase.from("products").delete().eq("id", sku.product_id);
  if (error) {
    return NextResponse.json({ error: "db_error", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ deleted: true, id });
}

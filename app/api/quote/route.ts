// app/api/quote/route.ts — Quote: authoritative priced cart (prices re-fetched, 5-min TTL)

import { NextRequest, NextResponse } from "next/server";
import { fetchCatalog } from "@/lib/catalog";
import { saveQuote, type QuoteLine } from "@/lib/quote-store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const skuIds = body?.skuIds as string[] | undefined;
  const quantities = body?.quantities as number[] | undefined;

  if (!skuIds || !quantities || skuIds.length !== quantities.length || skuIds.length === 0) {
    return NextResponse.json({ error: "invalid_request", message: "skuIds and quantities must match" }, { status: 400 });
  }
  if (skuIds.length > 20) {
    return NextResponse.json({ error: "invalid_request", message: "too many lines" }, { status: 400 });
  }

  const catalog = await fetchCatalog();
  const byId = new Map(catalog.map((c) => [c.id, c]));

  const lines: QuoteLine[] = [];
  for (let i = 0; i < skuIds.length; i++) {
    const item = byId.get(skuIds[i]);
    const qty = Math.max(1, Math.round(Number(quantities[i]) || 0));
    if (!item) {
      return NextResponse.json({ error: "invalid_request", message: `unknown SKU ${skuIds[i]}` }, { status: 400 });
    }
    if (item.stock < qty) {
      return NextResponse.json(
        { error: "insufficient_stock", message: `${item.name}: only ${item.stock} in stock` },
        { status: 409 },
      );
    }
    lines.push({
      sku: item.id,
      short: item.name,
      category: item.category,
      quantity: qty,
      unitPaise: item.pricePaise,
      proposedPaise: item.pricePaise,
      costPaise: item.costPaise,
      marginPct: item.marginPct,
      stock: item.stock,
    });
  }

  const totalPaise = lines.reduce((sum, l) => sum + l.unitPaise * l.quantity, 0);
  const quoteId = `Q-${Date.now().toString(36).toUpperCase()}`;
  const record = {
    quoteId,
    lines,
    totalPaise,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  saveQuote(record);
  return NextResponse.json(record);
}

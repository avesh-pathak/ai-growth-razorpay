// app/api/catalog/route.ts — Catalog feed (DB-backed, paginated, filters)

import { NextRequest, NextResponse } from "next/server";
import { fetchCatalog, filterCatalog } from "@/lib/catalog";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rl = rateLimit(`catalog:${getClientKey(request)}`, 100, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { type: "https://slashcheckout.dev/problems/rate-limited", title: "rate_limited", status: 429, detail: "too many catalog requests" },
      { status: 429, headers: { "Content-Type": "application/problem+json", "Retry-After": "60" } },
    );
  }
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const slug = searchParams.get("slug");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const full = searchParams.get("full") === "true";

  try {
    const all = await fetchCatalog();
    const filtered = filterCatalog(all, { category, q, slug });

    if (slug) {
      if (filtered.length === 0) {
        return NextResponse.json({ error: "not_found", message: "product not found" }, { status: 404 });
      }
      return NextResponse.json({ item: filtered[0] });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = full ? filtered : filtered.slice(start, start + limit);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      hasMore: full ? false : start + limit < total,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "catalog_unavailable", message: err instanceof Error ? err.message : "catalog read failed" },
      { status: 500 },
    );
  }
}

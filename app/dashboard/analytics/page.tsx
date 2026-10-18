// app/dashboard/analytics/page.tsx — Analytics (real data + bklit charts)

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/data/products";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { ChartTooltip } from "@/components/charts/tooltip";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";

interface OrderItem { sku: string; name: string; category: string; qty: number; unitPaise: number }
interface Order { id: string; status: string; total_paise: number; items: OrderItem[] | null; created_at: string }
interface Sku { id: string; name: string; category: string; pricePaise: number; stock: number; marginPct: number }

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [insight, setInsight] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [oRes, pRes] = await Promise.all([fetch("/api/orders?limit=500"), fetch("/api/products?limit=500&full=true")]);
        const [oData, pData] = await Promise.all([oRes.json(), pRes.json()]);
        if (cancelled) return;
        setOrders(oData.orders ?? []);
        setSkus(
          (pData.items ?? []).map((p: { id: string; name: string; category: string; pricePaise: number; stock: number; marginPct: number }) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            pricePaise: p.pricePaise,
            stock: p.stock,
            marginPct: p.marginPct,
          })),
        );
      } catch {
        // keep empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const paidOrders = orders.filter((o) => o.status === "captured" || o.status === "paid");

  // Revenue by category (from order items)
  const revenueByCategory = ["Brewers", "Grinders", "Kettles", "Accessories", "Beans", "Bundles"].map((cat) => ({
    name: cat,
    revenue: paidOrders.reduce((s, o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      return s + items.filter((i) => i.category === cat).reduce((ss, i) => ss + (i.unitPaise ?? 0) * (i.qty ?? 0), 0);
    }, 0),
  }));

  // Revenue trend by month
  const byMonth = new Map<string, number>();
  for (const o of paidOrders) {
    const key = o.created_at.slice(0, 7); // YYYY-MM
    byMonth.set(key, (byMonth.get(key) ?? 0) + (o.total_paise ?? 0));
  }
  const revenueByMonth = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, revenue]) => ({ name, revenue }));

  // Top products by revenue from order items
  const productRevenue = new Map<string, { name: string; revenue: number; qty: number }>();
  for (const o of paidOrders) {
    const items = Array.isArray(o.items) ? o.items : [];
    for (const i of items) {
      const cur = productRevenue.get(i.sku) ?? { name: i.name, revenue: 0, qty: 0 };
      cur.revenue += (i.unitPaise ?? 0) * (i.qty ?? 0);
      cur.qty += i.qty ?? 0;
      productRevenue.set(i.sku, cur);
    }
  }
  const topProducts = Array.from(productRevenue.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Restock forecast: low stock SKUs
  const lowStock = skus.filter((p) => p.stock < 15).sort((a, b) => a.stock - b.stock);

  // KPIs
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total_paise ?? 0), 0);
  const orderCount = paidOrders.length;
  const avgOrder = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  function handleAsk() {
    const low = lowStock.map((p) => p.name).join(", ");
    const top = topProducts[0]?.name ?? "—";
    setInsight(
      `Based on your store: ${lowStock.length} SKUs are running low on stock (${low || "none"}). Top seller by revenue is ${top}. ${orderCount} paid orders totalling ${formatPaise(totalRevenue)}.`,
    );
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-4.5rem)]">
        <span className="sr-only">Loading analytics…</span>
        <div aria-hidden className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
          <Skeleton className="mb-6 h-8 w-40" />

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-44" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="aspect-[2/1] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-52" />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="hidden h-4 w-20 sm:block" />
                  <Skeleton className="ml-auto h-4 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <h1 className="text-2xl font-semibold mb-6">Analytics</h1>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(totalRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Paid orders</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{orderCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg order value</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(avgOrder)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">SKUs</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{skus.length}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader><CardTitle>Revenue by category</CardTitle></CardHeader>
            <CardContent>
              <BarChart data={revenueByCategory} xDataKey="name" aspectRatio="2 / 1">
                <Grid />
                <BarXAxis />
                <Bar dataKey="revenue" fill="var(--brand)" />
                <ChartTooltip />
              </BarChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue trend</CardTitle></CardHeader>
            <CardContent>
              {revenueByMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid orders yet.</p>
              ) : (
                <AreaChart data={revenueByMonth} xDataKey="name" aspectRatio="2 / 1">
                  <Grid />
                  <XAxis />
                  <Area dataKey="revenue" fill="var(--brand)" />
                </AreaChart>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle>Top products by revenue</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales yet.</p>
            ) : (
              <Table className="table-cards">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell data-label="Product" className="font-medium">{p.name}</TableCell>
                      <TableCell data-label="Units sold">{p.qty}</TableCell>
                      <TableCell data-label="Revenue" className="font-mono">{formatPaise(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>AI restock forecast</CardTitle></CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-muted-foreground">All SKUs well-stocked.</p>
            ) : (
              <Table className="table-cards">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock left</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell data-label="Product" className="font-medium">{p.name}</TableCell>
                      <TableCell data-label="Category">{p.category}</TableCell>
                      <TableCell data-label="Price">{formatPaise(p.pricePaise)}</TableCell>
                      <TableCell data-label="Stock left">{p.stock}</TableCell>
                      <TableCell data-label="Status">
                        <Badge variant="destructive">Restock soon</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Natural language insights</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your store..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 flex-1 sm:h-8"
              />
              <Button className="h-11 sm:h-8" onClick={handleAsk}>Ask</Button>
            </div>
            {insight && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">{insight}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
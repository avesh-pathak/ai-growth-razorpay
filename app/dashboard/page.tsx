// app/dashboard/page.tsx — Merchant dashboard (real data from Supabase via API)

"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPaise } from "@/lib/data/products";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  stock: number;
  margin_pct: number | string;
  list_price_paise: number;
  products: { category: string | null } | null;
}

interface AuditEvent {
  id: string;
  created_at: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: { outcome?: string; verdict?: string } | null;
}

interface Order {
  id: string;
  status: string;
  total_paise: number;
  created_at: string;
}

function DashboardSkeleton() {
  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <span className="sr-only">Loading dashboard…</span>
      <div aria-hidden className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-44" />
        </div>

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

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-11 w-40 rounded-full sm:h-7" />
          </CardHeader>
          <CardContent className="space-y-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="hidden h-4 w-24 sm:block" />
                <Skeleton className="hidden h-4 w-16 md:block" />
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="hidden h-4 w-40 sm:block" />
                <Skeleton className="ml-auto h-6 w-20 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      setTodayKey(new Date().toDateString());
      const [prodRes, ordRes, auditRes] = await Promise.all([
        fetch("/api/products?limit=200"),
        fetch("/api/orders?limit=200"),
        fetch("/api/audit/events?limit=20"),
      ]);
      const [prodData, ordData, auditData] = await Promise.all([prodRes.json(), ordRes.json(), auditRes.json()]);
      // /api/products returns skus with product join
        setProducts(
          (prodData.items as { id: string; name: string; stock: number; marginPct: number; pricePaise: number; category: string }[]).map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            margin_pct: p.marginPct,
            list_price_paise: p.pricePaise,
            products: { category: p.category },
          })),
        );
      if (ordData.orders) setOrders(ordData.orders as Order[]);
      if (auditData.events) setAuditEvents(auditData.events as AuditEvent[]);
      setLoading(false);
    });
  }, []);

  const paidOrders = orders.filter((o) => o.status === "captured" || o.status === "paid");
  const paidTotal = paidOrders.reduce((sum, o) => sum + (o.total_paise ?? 0), 0);
  const revenueToday = todayKey
    ? paidOrders
        .filter((o) => new Date(o.created_at).toDateString() === todayKey)
        .reduce((sum, o) => sum + (o.total_paise ?? 0), 0)
    : 0;
  const avgOrder = paidOrders.length > 0 ? Math.round(paidTotal / paidOrders.length) : 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <div className="flex flex-col gap-1 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Merchant Dashboard</h1>
          <div className="max-w-full truncate text-sm text-muted-foreground">{user?.email ?? "Loading..."}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue today</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(revenueToday)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{orders.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg order value</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(avgOrder)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{products.length}</div></CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Products</CardTitle>
            <Link href="/dashboard/products">
              <Button variant="outline" size="sm" className="h-11 sm:h-7">Manage products</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table className="table-cards">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.slice(0, 10).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell data-label="Name" className="font-medium">{p.name}</TableCell>
                    <TableCell data-label="Category">{p.products?.category ?? "—"}</TableCell>
                    <TableCell data-label="Price">{formatPaise(p.list_price_paise)}</TableCell>
                    <TableCell data-label="Stock">{p.stock}</TableCell>
                    <TableCell data-label="Margin">{Number(p.margin_pct) || 0}%</TableCell>
                    <TableCell data-label="Status">
                      <Badge variant={p.stock > 0 ? "default" : "destructive"}>
                        {p.stock > 0 ? "In stock" : "Out of stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Live audit trail</CardTitle></CardHeader>
          <CardContent>
            {auditEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No audit events yet. Run a buyer-agent purchase or a chat to populate the trail.</p>
            ) : (
              <Table className="table-cards">
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((e) => {
                    const verdict = e.payload && typeof e.payload === "object" ? (e.payload.outcome ?? e.payload.verdict) : undefined;
                    return (
                      <TableRow key={e.id}>
                        <TableCell data-label="Time" className="font-mono text-sm text-muted-foreground">
                          {new Date(e.created_at).toLocaleTimeString()}
                        </TableCell>
                        <TableCell data-label="Actor" className="text-muted-foreground">{e.actor}</TableCell>
                        <TableCell data-label="Action" className="font-mono text-sm">{e.action}</TableCell>
                        <TableCell data-label="Entity" className="font-mono text-xs text-muted-foreground">
                          {e.entity_type} · {e.entity_id}
                        </TableCell>
                        <TableCell data-label="Verdict">
                          {verdict ? (
                            <Badge variant={String(verdict) === "approved" ? "default" : "destructive"}>
                              {String(verdict)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
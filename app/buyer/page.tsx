// app/buyer/page.tsx — Buyer dashboard (fetches from Supabase)

"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPaise } from "@/lib/data/products";
import Link from "next/link";

interface Order {
  id: string;
  created_at: string;
  total_paise: number;
  status: string;
}

interface Receipt {
  id: string;
  order_id: string | null;
  canonical_body: {
    proposal?: { totalPaise?: number };
    outcome?: "approved" | "blocked" | "failed";
  } | null;
}

interface Mandate {
  id: string;
  envelope: {
    maxPerOrderPaise?: number;
    maxDailyPaise?: number;
    expiry?: string;
  } | null;
  revoked_at: string | null;
}

function mandateStatus(m: Mandate): string {
  if (m.revoked_at) return "revoked";
  const expiry = m.envelope?.expiry ? new Date(m.envelope.expiry).getTime() : NaN;
  if (Number.isFinite(expiry) && expiry < Date.now()) return "expired";
  return "active";
}

export default function BuyerDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      const [oRes, rRes, mRes] = await Promise.all([
        fetch("/api/orders?limit=50"),
        fetch("/api/receipts?limit=50"),
        fetch("/api/mandates"),
      ]);
      const [oData, rData, mData] = await Promise.all([oRes.json(), rRes.json(), mRes.json()]);
      if (oData.orders) setOrders(oData.orders as unknown as Order[]);
      if (rData.receipts) setReceipts(rData.receipts as unknown as Receipt[]);
      if (mData.mandates) setMandates(mData.mandates as unknown as Mandate[]);
      setLoading(false);
    });
  }, []);

  const totalSpent = orders.reduce((s, o) => s + (o.total_paise || 0), 0);

  if (loading) {
    return (
      <main className="min-h-[calc(100dvh-4.5rem)] flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <div className="flex flex-col gap-1 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">Buyer Dashboard</h1>
          <div className="max-w-full truncate text-sm text-muted-foreground">{user?.email ?? "Loading..."}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total spent</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(totalSpent)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{orders.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Receipts</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{receipts.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active mandates</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{mandates.length}</div></CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle>Order history</CardTitle></CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet. <Link href="/products" className="text-brand hover:underline">Start shopping</Link></p>
            ) : (
              <Table className="table-cards">
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell data-label="Order ID" className="font-mono text-sm">{o.id}</TableCell>
                      <TableCell data-label="Date">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                      <TableCell data-label="Total">{formatPaise(o.total_paise)}</TableCell>
                      <TableCell data-label="Status">
                        <Badge variant={o.status === "captured" ? "default" : o.status === "refunded" ? "secondary" : "destructive"}>
                          {o.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader><CardTitle>Receipts</CardTitle></CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No receipts yet.</p>
            ) : (
              <Table className="table-cards">
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell data-label="Receipt ID" className="font-mono text-sm">{r.id}</TableCell>
                      <TableCell data-label="Order" className="font-mono text-sm">{r.order_id ?? "—"}</TableCell>
                      <TableCell data-label="Total">{formatPaise(r.canonical_body?.proposal?.totalPaise)}</TableCell>
                      <TableCell data-label="Status">
                        <Badge
                          variant={
                            r.canonical_body?.outcome === "failed"
                              ? "destructive"
                              : r.canonical_body?.outcome === "blocked"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {r.canonical_body?.outcome ?? "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active mandates</CardTitle></CardHeader>
          <CardContent>
            {mandates.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active mandates.</p>
            ) : (
              <Table className="table-cards">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mandate ID</TableHead>
                    <TableHead>Max per order</TableHead>
                    <TableHead>Max daily</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mandates.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell data-label="Mandate ID" className="font-mono text-sm">{m.id}</TableCell>
                      <TableCell data-label="Max per order">{formatPaise(m.envelope?.maxPerOrderPaise)}</TableCell>
                      <TableCell data-label="Max daily">{formatPaise(m.envelope?.maxDailyPaise)}</TableCell>
                      <TableCell data-label="Status">
                        <Badge variant={mandateStatus(m) === "active" ? "default" : "secondary"}>
                          {mandateStatus(m)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
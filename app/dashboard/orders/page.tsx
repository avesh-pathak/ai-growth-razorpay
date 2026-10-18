// app/dashboard/orders/page.tsx — Merchant orders: every checkout that reached the gate,
// with line-item details and a link to the signed receipt.

"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPaise } from "@/lib/data/products";

type OrderItem = { sku: string; name: string; category?: string; qty: number; unitPaise: number };

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_paise: number;
  receipt_id: string | null;
  mandate_id: string | null;
  items: OrderItem[] | null;
};

function OrderStatusBadge({ status }: { status: string }) {
  const variant =
    status === "captured" || status === "paid"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export default function MerchantOrdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, status, total_paise, receipt_id, mandate_id, items")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    void Promise.resolve().then(load);
  }, [load]);

  const captured = orders.filter((o) => o.status === "captured" || o.status === "paid");
  const capturedRevenue = captured.reduce((sum, o) => sum + (o.total_paise ?? 0), 0);
  const lines = selected?.items ?? [];

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Orders</h1>
          {loading ? (
            <Skeleton className="mt-1 h-4 w-56" />
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} total · {formatPaise(capturedRevenue)} captured (test mode)
            </p>
          )}
        </div>

        {!loading && !user && (
          <div className="mb-6 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Sign in with an owner or admin account to see order activity.
          </div>
        )}

        <Card>
          <CardContent className="p-0 max-sm:p-4">
            <Table className="table-cards">
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-6">
                      <div className="space-y-5" aria-hidden>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="hidden h-4 w-32 sm:block" />
                            <Skeleton className="hidden h-4 w-16 md:block" />
                            <Skeleton className="ml-auto h-6 w-20 rounded-full" />
                          </div>
                        ))}
                      </div>
                      <span className="sr-only">Loading orders…</span>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No orders yet — checkouts through the storefront or the buyer agent land here.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell data-label="Order" className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell data-label="Date" className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell data-label="Items">{order.items?.length ?? 0}</TableCell>
                      <TableCell data-label="Total">{formatPaise(order.total_paise)}</TableCell>
                      <TableCell data-label="Status">
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell data-label="Receipt" className="font-mono text-xs text-muted-foreground">
                        {order.receipt_id ?? "—"}
                      </TableCell>
                      <TableCell data-label="Details" className="text-right">
                        <Button variant="outline" size="sm" className="h-11 sm:h-7" onClick={() => setSelected(order)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-sm">{selected.id}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  {new Date(selected.created_at).toLocaleString()}
                  <OrderStatusBadge status={selected.status} />
                </DialogDescription>
              </DialogHeader>

              {lines.length > 0 ? (
                <Table className="table-cards">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Line total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((item, index) => (
                      <TableRow key={`${item.sku}-${index}`}>
                        <TableCell data-label="Item">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{item.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell data-label="Qty">{item.qty}</TableCell>
                        <TableCell data-label="Unit">{formatPaise(item.unitPaise)}</TableCell>
                        <TableCell data-label="Line total" className="text-right">{formatPaise(item.unitPaise * item.qty)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">{formatPaise(selected.total_paise)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No line items were recorded for this order.</p>
              )}

              <DialogFooter>
                {selected.receipt_id && (
                  <Button
                    variant="outline"
                    className="h-11 sm:h-9"
                    render={
                      <a href={`/api/receipts/${selected.receipt_id}`} target="_blank" rel="noreferrer" />
                    }
                  >
                    View receipt
                  </Button>
                )}
                <Button variant="outline" className="h-11 sm:h-9" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

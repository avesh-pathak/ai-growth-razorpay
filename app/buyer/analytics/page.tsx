// app/buyer/analytics/page.tsx — Buyer analytics

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPaise } from "@/lib/data/products";

const purchaseHistory = [
  { month: "Oct", amount: 2564400, orders: 3 },
  { month: "Sep", amount: 1899000, orders: 2 },
  { month: "Aug", amount: 349900, orders: 1 },
];

const topCategories = [
  { category: "Brewers", pct: 40 },
  { category: "Grinders", pct: 25 },
  { category: "Beans", pct: 20 },
  { category: "Accessories", pct: 15 },
];

export default function BuyerAnalyticsPage() {
  const totalSpent = purchaseHistory.reduce((s, p) => s + p.amount, 0);
  const totalOrders = purchaseHistory.reduce((s, p) => s + p.orders, 0);

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <h1 className="text-2xl font-semibold mb-6">Buyer Analytics</h1>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total spent</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(totalSpent)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total orders</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{totalOrders}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg order value</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{formatPaise(Math.round(totalSpent / totalOrders))}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Spending by month</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseHistory.map((p) => (
                    <TableRow key={p.month}>
                      <TableCell className="font-medium">{p.month}</TableCell>
                      <TableCell>{p.orders}</TableCell>
                      <TableCell className="font-mono">{formatPaise(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Spending by category</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Share of spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCategories.map((c) => (
                    <TableRow key={c.category}>
                      <TableCell className="font-medium">{c.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${c.pct}%` }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{c.pct}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
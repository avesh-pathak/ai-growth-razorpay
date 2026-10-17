import { BarChart3, TrendingUp, ShoppingCart, Users, Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRODUCTS, formatPaise } from "@/lib/data/products";

const KPI = [
  { label: "Revenue (30d)", value: "₹4,82,340", delta: "+18.2%", icon: TrendingUp },
  { label: "Orders", value: "312", delta: "+9.4%", icon: ShoppingCart },
  { label: "Avg order value", value: "₹1,546", delta: "+4.1%", icon: BarChart3 },
  { label: "Conversion", value: "3.8%", delta: "+0.6pt", icon: Users },
];

const TOP = PRODUCTS.slice(0, 6).map((p, i) => ({
  name: p.name,
  revenue: Math.round(p.pricePaise * (12 - i) * 1.3),
  units: 12 - i,
}));

const CATEGORIES = [
  { name: "Brewers", share: 34 },
  { name: "Grinders", share: 26 },
  { name: "Kettles", share: 18 },
  { name: "Accessories", share: 14 },
  { name: "Beans", share: 8 },
];

const AUDIT = [
  { time: "14:32:01", actor: "buyer-agent", action: "checkout.completed", entity: "order ord_8f2a1c", verdict: "allowed", rule: "—" },
  { time: "14:31:58", actor: "policy-gate", action: "evaluate", entity: "proposal P-441", verdict: "allowed", rule: "all 7 passed" },
  { time: "14:31:40", actor: "merchant-agent", action: "proposal.blocked", entity: "bundle B-12", verdict: "blocked", rule: "margin_floor" },
  { time: "14:30:12", actor: "buyer-agent", action: "quote.requested", entity: "quote Q-991", verdict: "allowed", rule: "—" },
  { time: "14:28:55", actor: "system", action: "stock.decrement", entity: "sku v60-02", verdict: "allowed", rule: "—" },
  { time: "14:25:10", actor: "buyer-agent", action: "mandate.issued", entity: "mandate M-77", verdict: "allowed", rule: "—" },
];

const RESTOCK = [
  { name: "Electric Grinder E1", stock: 8, forecast: "12 days", risk: "high" },
  { name: "Gooseneck Kettle — Stagg", stock: 15, forecast: "18 days", risk: "medium" },
  { name: "Travel Grinder Mini", stock: 20, forecast: "24 days", risk: "low" },
];

export default function DashboardPage() {
  return (
    <div className="max-w-frame mx-auto w-full px-6 sm:px-8 lg:px-12 py-24 md:py-32">
      <div className="flex flex-col gap-4 max-w-[39rem]">
        <h1 className="font-heading text-[clamp(2.5rem,1.5rem+2.5vw,3.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-foreground">
          Revenue &amp; audit
        </h1>
        <p className="text-[1.125rem] leading-[1.5] text-muted-foreground">
          Every money action, explained and verifiable. Metrics annotated with assumptions.
        </p>
      </div>

      {/* KPIs */}
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{k.value}</div>
              <p className="text-xs text-positive">{k.delta} vs prior 30d</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top products by revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {TOP.map((t, i) => (
                <div key={t.name} className="flex items-center gap-4">
                  <span className="w-5 text-[11px] text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-sm text-foreground truncate">{t.name}</span>
                  <span className="text-[12px] text-muted-foreground">{t.units} units</span>
                  <span className="w-24 text-right text-sm font-medium text-foreground">{formatPaise(t.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {CATEGORIES.map((c) => (
                <div key={c.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-[12px] text-muted-foreground">{c.share}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${c.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restock forecast */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            AI restock forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {RESTOCK.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.stock} in stock · ~{r.forecast}</p>
                </div>
                <Badge variant={r.risk === "high" ? "destructive" : r.risk === "medium" ? "default" : "secondary"}>
                  {r.risk}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit trail */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" />
            Live audit trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-4">hash-chained · append-only</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Verdict</TableHead>
                <TableHead>Rule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {AUDIT.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">{a.time}</TableCell>
                  <TableCell className="text-foreground">{a.actor}</TableCell>
                  <TableCell className="font-mono text-[12px] text-foreground">{a.action}</TableCell>
                  <TableCell className="text-muted-foreground">{a.entity}</TableCell>
                  <TableCell>
                    <Badge variant={a.verdict === "blocked" ? "destructive" : "default"}>
                      {a.verdict}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">{a.rule}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

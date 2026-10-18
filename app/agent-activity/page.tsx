// app/agent-activity/page.tsx - Agent activity view (real reasoning traces, proposal log, mandate/receipt chain)

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPaise } from "@/lib/data/products";

type AuditPayload = {
  totalPaise?: number;
  outcome?: string;
  determiningRule?: string;
  reason?: string;
  [key: string]: unknown;
};

type AuditEvent = {
  id: string;
  created_at: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload: AuditPayload | null;
  hash: string;
};

type Receipt = {
  id: string;
  order_id: string;
  total_paise?: number;
  canonical_body: Record<string, unknown> | null;
  hash: string;
  created_at: string;
};

type Mandate = {
  id: string;
  envelope: {
    maxPerOrderPaise?: number;
    maxDailyPaise?: number;
    expiry?: string;
  } | null;
  issued_at: string;
  revoked_at: string | null;
  checkout_hash: string | null;
};

export default function AgentActivityPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [eRes, rRes, mRes] = await Promise.all([
          fetch("/api/audit/events?limit=60"),
          fetch("/api/receipts?limit=20"),
          fetch("/api/mandates"),
        ]);
        if (!eRes.ok || !rRes.ok || !mRes.ok) throw new Error("failed to load activity");
        const [eData, rData, mData] = await Promise.all([eRes.json(), rRes.json(), mRes.json()]);
        if (cancelled) return;
        setEvents(eData.events ?? []);
        setReceipts(rData.receipts ?? []);
        setMandates(mData.mandates ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const proposals = events.filter((e) => e.action === "proposal.allowed" || e.action === "proposal.blocked" || e.action === "policy.evaluated");

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-8">
        <h1 className="text-2xl font-semibold mb-6">Agent Activity</h1>

        {loading && <p className="text-sm text-muted-foreground">Loading activity…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <Tabs defaultValue="audit">
            <TabsList>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="mandates">Mandates & Receipts</TabsTrigger>
            </TabsList>

            <TabsContent value="audit" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Hash-chained audit events (newest first)</CardTitle></CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events yet. Run a buyer-agent purchase or a chat to populate the trail.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12.5px]">
                        <thead>
                          <tr className="border-b border-border text-left font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                            <th className="py-2 pr-3">When</th>
                            <th className="py-2 pr-3">Actor</th>
                            <th className="py-2 pr-3">Action</th>
                            <th className="py-2 pr-3">Entity</th>
                            <th className="py-2 pr-3">Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((e) => (
                            <tr key={e.id} className="border-b border-border/60">
                              <td className="py-2 pr-3 font-mono text-[10.5px] text-muted-foreground">{new Date(e.created_at).toLocaleTimeString()}</td>
                              <td className="py-2 pr-3">{e.actor}</td>
                              <td className="py-2 pr-3 font-medium">{e.action}</td>
                              <td className="py-2 pr-3 font-mono text-[10.5px] text-muted-foreground">{e.entity_type}:{e.entity_id.slice(0, 12)}</td>
                              <td className="py-2 pr-3 font-mono text-[10px] text-muted-foreground/70">{e.hash?.slice(0, 12)}…</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proposals" className="mt-4">
              <Card>
                <CardHeader><CardTitle>Proposal log (merchant + buyer agent)</CardTitle></CardHeader>
                <CardContent>
                  {proposals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No proposals yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {proposals.map((e) => (
                        <div key={e.id} className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[13px]">{e.action}</span>
                            <Badge variant={e.action.includes("blocked") ? "destructive" : "secondary"}>
                              {e.payload?.outcome ?? (e.action.includes("blocked") ? "blocked" : "allowed")}
                            </Badge>
                          </div>
                          <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                            {e.payload?.totalPaise ? formatPaise(e.payload.totalPaise) : ""} · {e.actor} · {new Date(e.created_at).toLocaleString()}
                          </p>
                          {e.payload?.determiningRule && (
                            <p className="mt-1 text-[12px] text-muted-foreground">Blocked at: {e.payload.determiningRule} — {e.payload.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mandates" className="mt-4 space-y-4">
              <Card>
                <CardHeader><CardTitle>Mandates</CardTitle></CardHeader>
                <CardContent>
                  {mandates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No mandates yet. Run a buyer-agent purchase to create one.</p>
                  ) : (
                    <div className="space-y-2">
                      {mandates.map((m) => (
                        <div key={m.id} className="rounded-xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[13px]">{m.id}</span>
                            <Badge variant={m.revoked_at ? "destructive" : "secondary"}>{m.revoked_at ? "revoked" : "active"}</Badge>
                          </div>
                          <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                            per-order {formatPaise(m.envelope?.maxPerOrderPaise ?? 0)} · daily {formatPaise(m.envelope?.maxDailyPaise ?? 0)} · expires {m.envelope?.expiry ? new Date(m.envelope.expiry).toLocaleTimeString() : "—"}
                          </p>
                          {m.checkout_hash && <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">checkout hash: {m.checkout_hash.slice(0, 16)}…</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Receipts</CardTitle></CardHeader>
                <CardContent>
                  {receipts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No receipts yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {receipts.map((r) => {
                        const body = (r.canonical_body ?? {}) as { outcome?: string; totalPaise?: number; total_paise?: number };
                        const total = typeof r.total_paise === "number" ? r.total_paise : (typeof body.totalPaise === "number" ? body.totalPaise : (typeof body.total_paise === "number" ? body.total_paise : undefined));
                        const outcome = typeof body.outcome === "string" ? body.outcome : "issued";
                        return (
                          <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-[13px]">{r.id}</span>
                              <Badge variant="secondary">{outcome}</Badge>
                            </div>
                            <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                              {total ? formatPaise(total) : ""} · {new Date(r.created_at).toLocaleString()} · hash {r.hash?.slice(0, 12)}…
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
// app/chat/page.tsx - Merchant Agent chat surface (real LLM, gate-checked proposals)

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatPaise } from "@/lib/data/products";
import { cn } from "@/lib/utils";

type Proposal = {
  skuIds: string[];
  lines: { sku: string; short: string; quantity: number; unitPaise: number }[];
  totalPaise: number;
  verdict: { outcome: string; determiningRule?: string; reason?: string };
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  proposals?: Proposal[];
  trace?: { thought: string; toolCall: string; result: string }[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm the Merchant Agent for Kindred Coffee Supply. Tell me what you're trying to brew and your budget, and I'll put together a gate-checked bundle." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: `Sorry - ${data?.message ?? "something went wrong"}.` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, proposals: data.proposals, trace: data.trace }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error - please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-4.5rem)]">
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Chat with Merchant Agent</h1>
          <button
            type="button"
            onClick={() => setShowTrace((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            {showTrace ? "Hide" : "Show"} reasoning
          </button>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "bg-brand text-brand-foreground" : "bg-muted text-foreground"}`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.proposals && m.proposals.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.proposals.map((p, pi) => {
                          const approved = p.verdict?.outcome === "approved";
                          return (
                            <div key={pi} className={cn("rounded-xl border p-3", approved ? "border-positive/30 bg-positive/5" : "border-destructive/30 bg-destructive/5")}>
                              <div className="flex items-center justify-between gap-2">
                                <span className={cn("font-mono text-[10px] uppercase tracking-[0.14em]", approved ? "text-positive" : "text-destructive")}>
                                  {approved ? "Gate approved" : `Blocked: ${p.verdict?.determiningRule ?? "policy"}`}
                                </span>
                                <span className="font-mono text-[12px] tabular-nums text-foreground">{formatPaise(p.totalPaise)}</span>
                              </div>
                              <ul className="mt-2 flex flex-col gap-0.5">
                                {p.lines.map((l, li) => (
                                  <li key={li} className="flex items-center justify-between gap-3 text-[12.5px]">
                                    <span className="truncate">{l.short} × {l.quantity}</span>
                                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{formatPaise(l.unitPaise)}</span>
                                  </li>
                                ))}
                              </ul>
                              {!approved && p.verdict?.reason && (
                                <p className="mt-2 text-[12px] leading-[1.5] text-muted-foreground">{p.verdict.reason}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {showTrace && m.trace && m.trace.length > 0 && (
                      <div className="mt-3 rounded-xl border border-border bg-background/60 p-2.5">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Reasoning</p>
                        <ul className="flex flex-col gap-1">
                          {m.trace.map((t, ti) => (
                            <li key={ti} className="font-mono text-[10px] leading-[1.5] text-muted-foreground">
                              <span className="text-foreground/70">{t.toolCall}</span> — {t.result.slice(0, 120)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2 text-sm text-muted-foreground">Thinking…</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about coffee gear..."
            enterKeyHint="send"
            className="h-11 flex-1 sm:h-8"
            disabled={loading}
          />
          <Button className="h-11 sm:h-8" onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </main>
  );
}
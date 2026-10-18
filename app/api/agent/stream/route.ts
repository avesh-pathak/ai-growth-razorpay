// app/api/agent/stream/route.ts - Real SSE streaming for the Buyer Agent graph
// Runs the LangGraph Buyer Agent and streams node/tool/gate/receipt events.

import { NextRequest } from "next/server";
import { createBuyerGraph } from "@/lib/agent/buyer-graph";
import { getMemoryCheckpointer } from "@/lib/agent/checkpointer";

export const instant = false;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const goal = searchParams.get("goal") ?? "set up a home espresso station";
  const budget = parseInt(searchParams.get("budget") ?? "80000", 10);
  const threadId = searchParams.get("thread") ?? `stream-${Date.now().toString(36)}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const checkpointer = await getMemoryCheckpointer();
        const graph = createBuyerGraph(checkpointer);
        const input = { goal, budgetPaise: budget, sessionId: threadId, agentId: "buyer-agent" };

        const eventStream = graph.streamEvents(input, {
          version: "v2",
          configurable: { thread_id: threadId },
        });

        for await (const ev of eventStream) {
          const name = ev.event;
          const node = ev.metadata?.langgraph_node ?? ev.name;
          if (name === "on_chain_start" && node && !node.startsWith("__")) {
            send("node:start", { node, timestamp: Date.now() });
          } else if (name === "on_chain_end" && node && !node.startsWith("__")) {
            const out = ev.data?.output;
            if (node === "policyGate" && out?.gateVerdict) {
              send("gate:verdict", {
                outcome: out.gateVerdict.outcome,
                rule: out.gateVerdict.determiningRule ?? null,
                reason: out.gateVerdict.reason ?? null,
              });
            } else if (node === "issueReceipt" && out?.receipt) {
              send("receipt:issued", { receiptId: out.receipt.receiptId, status: out.receipt.outcome });
            } else {
              send("node:end", { node, result: summarize(out) });
            }
          } else if (name === "on_tool_start") {
            send("tool:call", { tool: ev.name, args: ev.data?.input });
          } else if (name === "on_tool_end") {
            send("tool:result", { tool: ev.name, result: summarize(ev.data?.output) });
          }
        }

        send("done", { status: "complete", threadId });
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function summarize(out: unknown): string {
  if (out == null) return "";
  if (typeof out === "string") return out.slice(0, 200);
  try {
    const s = JSON.stringify(out);
    return s.length > 200 ? s.slice(0, 200) + "…" : s;
  } catch {
    return String(out).slice(0, 200);
  }
}
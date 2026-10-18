// app/api/agent/chat/route.ts - Merchant Agent: conversational selling with LLM tool-calling
// The LLM may search the catalog, draft proposals, and run the Policy Gate.
// Only gate-approved proposals are presented as recommendations; blocked ones
// are explained in plain language. Every proposal is audit-logged.

import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/policy/store";
import { formatPaise } from "@/lib/data/products";
import { createLLM } from "@/lib/agent/llm";
import { createTools } from "@/lib/agent/tools-factory";
import { runAgentLoop } from "@/lib/agent/run-loop";
import { rateLimit, getClientKey } from "@/lib/rate-limit";

export const instant = false;

const SYSTEM_PROMPT = `You are the Merchant Agent for Kindred Coffee Supply, a specialty coffee gear store.
Your job is to help shoppers find the right coffee equipment and complete their purchase.

Persona: warm, knowledgeable, not pushy. Explains trade-offs honestly. Recommends based on fit, not price. Says when something isn't a fit.

Capabilities: search the product catalog by category/price/tags; draft proposals (bundles, upsells, cross-sells); check proposals against the Policy Gate before showing them; present gate-approved recommendations; answer questions about products, brewing methods, compatibility.

Rules:
1. Never show a proposal that hasn't passed the Policy Gate. Always call evaluatePolicy before presenting a bundle.
2. If a proposal is blocked, explain why in plain language and suggest an alternative.
3. If you don't have a great match, say so honestly and ask one clarifying question.
4. All prices are in INR. Format prices as ₹X,XXX.XX (convert paise to rupees by dividing by 100).
5. Growth features: bundles (machine + grinder + beans), cross-sell accessories, "complete the setup" prompts.
6. Keep replies concise (under 120 words) and end with one clear next step.
7. IMPORTANT: After evaluatePolicy returns, stop calling tools and write a final reply to the shopper summarizing the recommendation and the gate result. Do not call more tools after that.

When you find products, propose a bundle of 2-4 complementary items, run evaluatePolicy, then present the result.`;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const message = (body?.message as string | undefined)?.trim();
  if (!message) {
    return NextResponse.json({ error: "invalid_request", message: "message is required" }, { status: 400 });
  }
  const history = Array.isArray(body?.history) ? body.history : [];
  const sessionId = (body?.sessionId as string | undefined) || `chat-${Date.now().toString(36)}`;

  const limit = rateLimit(`chat:${getClientKey(request, sessionId)}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited", message: "too many requests" }, { status: 429 });
  }

  let llm: Awaited<ReturnType<typeof createLLM>>["llm"];
  let provider: string;
  try {
    const created = await createLLM();
    llm = created.llm;
    provider = created.provider;
  } catch (e) {
    return NextResponse.json({ error: "llm_unavailable", message: e instanceof Error ? e.message : "LLM not configured" }, { status: 503 });
  }

  // Merchant-side tools: the gate checks margin floor / category / price source-of-truth.
  const tools = createTools({ buyerId: sessionId, merchantSide: true });

  let result: Awaited<ReturnType<typeof runAgentLoop>>;
  try {
    result = await runAgentLoop({ llm, tools, systemPrompt: SYSTEM_PROMPT, userMessage: message, history, maxIterations: 6 });
  } catch (e) {
    return NextResponse.json({ error: "agent_error", message: e instanceof Error ? e.message : "agent failed" }, { status: 500 });
  }

  // Extract proposals + verdicts from tool results
  const proposals: { proposalId: string; skuIds: string[]; lines: { sku: string; short: string; quantity: number; unitPaise: number }[]; totalPaise: number; verdict: { outcome: string; determiningRule?: string; reason?: string } }[] = [];
  for (const [toolName, raw] of Object.entries(result.toolResults)) {
    try {
      const parsed = JSON.parse(raw);
      if (toolName === "evaluatePolicy" && parsed?.verdict) {
        // find the matching proposeBundle result to get lines
        const bundleRaw = result.toolResults["proposeBundle"];
        const bundle = bundleRaw ? JSON.parse(bundleRaw) : null;
        proposals.push({
          proposalId: parsed.proposalId ?? `prop-${Date.now()}`,
          skuIds: bundle?.proposal?.lines?.map((l: { sku: string }) => l.sku) ?? [],
          lines: bundle?.proposal?.lines ?? [],
          totalPaise: parsed.totalPaise ?? bundle?.proposal?.totalPaise ?? 0,
          verdict: parsed.verdict,
        });
      }
    } catch {
      // ignore parse errors
    }
  }

  // Audit-log each proposal
  for (const p of proposals) {
    await appendAuditEvent({
      actor: "merchant-agent",
      action: p.verdict?.outcome === "approved" ? "proposal.allowed" : "proposal.blocked",
      entityType: "proposal",
      entityId: p.proposalId,
      payload: {
        lines: p.lines.map((l: { sku: string; short: string; quantity: number; unitPaise: number }) => ({ sku: l.sku, name: l.short, qty: l.quantity, pricePaise: l.unitPaise })),
        totalPaise: p.totalPaise,
        outcome: p.verdict?.outcome,
        determiningRule: p.verdict?.determiningRule ?? null,
        reason: p.verdict?.reason ?? null,
        sessionId,
        provider,
      },
    }).catch(() => {});
  }

  // Build a readable reply if the LLM didn't produce one (or echoed raw JSON)
  let reply = result.reply ?? "";
  if (!reply.trim() || reply.trim().startsWith("{")) {
    const p = proposals[0];
    if (p) {
      const items = p.lines.map((l) => `${l.short}`).join(" + ");
      reply = p.verdict?.outcome === "approved"
        ? `I'd recommend: ${items}. Total ${formatPaise(p.totalPaise)}. This bundle passed the Policy Gate (all 7 rules), so it's ready to buy. Want me to add it to your cart?`
        : `I considered ${items} (${formatPaise(p.totalPaise)}), but the Policy Gate blocked it: ${p.verdict?.reason ?? p.verdict?.determiningRule ?? "policy check"}. Let me find an alternative that fits.`;
    } else {
      reply = "I couldn't find a great match for that. Could you tell me more about what you're brewing and your budget?";
    }
  }

  return NextResponse.json({
    reply,
    proposals,
    trace: result.trace,
    sessionId,
    provider,
    iterations: result.iterations,
  });
}
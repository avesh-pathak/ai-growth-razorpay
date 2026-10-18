// app/api/agent/resume/route.ts - Resume a HITL-interrupted buyer graph run

import { NextRequest, NextResponse } from "next/server";
import { Command } from "@langchain/langgraph";
import { createBuyerGraph } from "@/lib/agent/buyer-graph";
import { getMemoryCheckpointer } from "@/lib/agent/checkpointer";

export const instant = false;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const threadId = body?.threadId as string | undefined;
  const decision = body?.decision;
  if (!threadId || !decision) {
    return NextResponse.json({ error: "invalid_request", message: "threadId and decision required" }, { status: 400 });
  }

  try {
    const checkpointer = await getMemoryCheckpointer();
    const graph = createBuyerGraph(checkpointer);
    const result = await graph.invoke(new Command({ resume: decision }), {
      configurable: { thread_id: threadId },
    });
    return NextResponse.json({ status: "resumed", result });
  } catch (e) {
    return NextResponse.json({ error: "resume_failed", message: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
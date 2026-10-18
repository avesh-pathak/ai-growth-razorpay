// lib/agent/run-loop.ts - manual tool-calling loop with reasoning trace capture

import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { StructuredToolInterface } from "@langchain/core/tools";

export type TraceStep = {
  thought: string;
  toolCall: string;
  args: unknown;
  result: string;
  decision: string;
};

export type RunLoopResult = {
  reply: string;
  trace: TraceStep[];
  toolResults: Record<string, string>;
  iterations: number;
};

export async function runAgentLoop(params: {
  llm: BaseChatModel;
  tools: StructuredToolInterface[];
  systemPrompt: string;
  userMessage: string;
  history?: { role: string; content: string }[];
  maxIterations?: number;
}): Promise<RunLoopResult> {
  const { llm, tools, systemPrompt, userMessage, history = [], maxIterations = 6 } = params;
  const llmWithTools = (llm as any).bindTools ? (llm as any).bindTools(tools) : llm;
  const toolMap = new Map(tools.map((t) => [t.name, t]));

  const messages: any[] = [new SystemMessage(systemPrompt)];
  for (const h of history) {
    messages.push(h.role === "assistant" ? new AIMessage(h.content) : new HumanMessage(h.content));
  }
  messages.push(new HumanMessage(userMessage));

  const trace: TraceStep[] = [];
  const toolResults: Record<string, string> = {};
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;
    const res: any = await llmWithTools.invoke(messages);
    messages.push(res);

    const toolCalls = res.tool_calls ?? res.additional_kwargs?.tool_calls ?? [];
    if (!toolCalls || toolCalls.length === 0) {
      // Final reply
      const reply = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
      return { reply, trace, toolResults, iterations };
    }

    for (const tc of toolCalls) {
      const name = tc.name ?? tc.function?.name;
      const args = tc.args ?? (tc.function?.arguments ? JSON.parse(tc.function.arguments) : {});
      const tool = toolMap.get(name);
      let result = "";
      try {
        result = tool ? String(await tool.invoke(args)) : `Unknown tool: ${name}`;
      } catch (e) {
        result = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
      }
      toolResults[name] = result;
      messages.push(new ToolMessage({ content: result, tool_call_id: tc.id ?? tc.call_id ?? `call_${i}` }));
      trace.push({
        thought: typeof res.content === "string" ? res.content.slice(0, 400) : "",
        toolCall: name,
        args,
        result: result.slice(0, 600),
        decision: result.startsWith("ERROR") ? "error" : "ok",
      });
    }
  }

  // Exhausted iterations - take last assistant content if any
  const last = messages[messages.length - 1];
  const reply = typeof last?.content === "string" ? last.content : "I wasn't able to complete that request.";
  return { reply, trace, toolResults, iterations };
}
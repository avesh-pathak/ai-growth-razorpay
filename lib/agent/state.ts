/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/agent/state.ts - LangGraph state schemas (MerchantState, BuyerState)

import { Annotation } from "@langchain/langgraph";

function ow<T>(def?: () => T) {
  return {
    value: (x: T, y: T): T => y,
    default: def,
  };
}

export const MerchantState = Annotation.Root({
  sessionId: Annotation<string>(ow<string>(() => "")),
  agentId: Annotation<string>(ow<string>(() => "")),
  createdAt: Annotation<string>(ow<string>(() => new Date().toISOString())),
  shopperMessage: Annotation<string>(ow<string>(() => "")),
  conversationHistory: Annotation<{ role: string; content: string }[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  catalogSnapshot: Annotation<any[]>(ow<any[]>(() => [])),
  proposal: Annotation<any | null>(ow<any | null>(() => null)),
  recommendation: Annotation<any | null>(ow<any | null>(() => null)),
  gateVerdict: Annotation<any | null>(ow<any | null>(() => null)),
  auditEvents: Annotation<any[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  error: Annotation<string | null>(ow<string | null>(() => null)),
  retryCount: Annotation<number>(ow<number>(() => 0)),
  hitlStatus: Annotation<"pending" | "approved" | "rejected" | "modified" | "timeout">(ow<"pending" | "approved" | "rejected" | "modified" | "timeout">(() => "pending")),
  hitlApproval: Annotation<any | null>(ow<any | null>(() => null)),
  reasoningTrace: Annotation<{ thought: string; toolCall: string; result: string; decision: string }[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
});

export const BuyerState = Annotation.Root({
  sessionId: Annotation<string>(ow<string>(() => "")),
  agentId: Annotation<string>(ow<string>(() => "")),
  createdAt: Annotation<string>(ow<string>(() => new Date().toISOString())),
  goal: Annotation<string>(ow<string>(() => "")),
  budgetPaise: Annotation<number>(ow<number>(() => 0)),
  constraints: Annotation<Record<string, unknown>>(ow<Record<string, unknown>>(() => ({}))),
  catalogSnapshot: Annotation<any[]>(ow<any[]>(() => [])),
  proposedCart: Annotation<any | null>(ow<any | null>(() => null)),
  gateVerdict: Annotation<any | null>(ow<any | null>(() => null)),
  quote: Annotation<any | null>(ow<any | null>(() => null)),
  receipt: Annotation<any | null>(ow<any | null>(() => null)),
  mandate: Annotation<any | null>(ow<any | null>(() => null)),
  auditEvents: Annotation<any[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  error: Annotation<string | null>(ow<string | null>(() => null)),
  retryCount: Annotation<number>(ow<number>(() => 0)),
  hitlStatus: Annotation<"pending" | "approved" | "rejected" | "modified" | "timeout">(ow<"pending" | "approved" | "rejected" | "modified" | "timeout">(() => "pending")),
  hitlApproval: Annotation<any | null>(ow<any | null>(() => null)),
  reasoningTrace: Annotation<{ thought: string; toolCall: string; result: string; decision: string }[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
});
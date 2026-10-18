// lib/agent/checkpointer.ts — Supabase-backed LangGraph checkpointer

import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";

let pool: Pool | null = null;
let saver: PostgresSaver | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error("Missing SUPABASE_DB_URL for LangGraph checkpointer");
  }
  pool = new Pool({
    connectionString: dbUrl,
    max: 1, // serverless: single connection
    ssl: { rejectUnauthorized: false },
  });
  return pool;
}

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (saver) return saver;
  const p = getPool();
  saver = new PostgresSaver(p, undefined, { schema: "langgraph" });
  await saver.setup();
  return saver;
}

export async function getMemoryCheckpointer() {
  const { MemorySaver } = await import("@langchain/langgraph");
  return new MemorySaver();
}
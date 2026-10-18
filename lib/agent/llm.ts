// lib/agent/llm.ts - thin LLM provider interface (Gemini + Groq, env-configurable, fallback)

export type LLMProvider = "gemini" | "groq";

export function hasProviderKey(provider: LLMProvider): boolean {
  if (provider === "groq") return Boolean(process.env.GROK_API_KEY);
  return Boolean(process.env.GOOGLE_API_KEY);
}

export function getLLMProvider(): LLMProvider {
  const requested = process.env.LLM_PROVIDER?.toLowerCase();
  if (requested === "gemini" && hasProviderKey("gemini")) return "gemini";
  if (requested === "groq" && hasProviderKey("groq")) return "groq";
  // Auto-detect from available keys (prefer Gemini for tool-calling reliability).
  if (hasProviderKey("gemini")) return "gemini";
  if (hasProviderKey("groq")) return "groq";
  return "groq"; // default; will fail at call time with a clear error
}

export function getFallbackProvider(primary: LLMProvider): LLMProvider {
  return primary === "gemini" ? "groq" : "gemini";
}

export async function createLLM(provider?: LLMProvider): Promise<{ llm: any; provider: LLMProvider }> {
  let p = provider ?? getLLMProvider();
  if (!hasProviderKey(p)) {
    const fb = getFallbackProvider(p);
    if (hasProviderKey(fb)) p = fb;
  }
  if (p === "groq") {
    if (!process.env.GROK_API_KEY) throw new Error("GROK_API_KEY is not set");
    const { ChatGroq } = await import("@langchain/groq");
    return {
      llm: new ChatGroq({ apiKey: process.env.GROK_API_KEY, model: "openai/gpt-oss-20b", temperature: 0.3 }),
      provider: "groq",
    };
  }
  if (!process.env.GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY is not set");
  const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
  return {
    llm: new ChatGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY, model: "gemini-2.5-flash-lite", temperature: 0.3 }),
    provider: "gemini",
  };
}
// lib/quote-store.ts — in-memory quote store with 5-minute TTL (single-process demo runtime)

export type QuoteLine = {
  sku: string;
  short: string;
  category: string;
  quantity: number;
  unitPaise: number;
  proposedPaise: number;
  costPaise: number;
  marginPct: number;
  stock: number;
};

export type QuoteRecord = {
  quoteId: string;
  lines: QuoteLine[];
  totalPaise: number;
  expiresAt: string;
  createdAt: string;
};

const globalForQuotes = globalThis as unknown as { __quotes?: Map<string, QuoteRecord> };
const quotes: Map<string, QuoteRecord> =
  globalForQuotes.__quotes ?? (globalForQuotes.__quotes = new Map());

export function saveQuote(record: QuoteRecord): void {
  pruneExpired();
  quotes.set(record.quoteId, record);
}

export function getQuote(quoteId: string): QuoteRecord | null {
  const quote = quotes.get(quoteId);
  if (!quote) return null;
  if (new Date(quote.expiresAt).getTime() < Date.now()) {
    quotes.delete(quoteId);
    return null;
  }
  return quote;
}

export function consumeQuote(quoteId: string): void {
  quotes.delete(quoteId);
}

export function pruneExpired(): void {
  const now = Date.now();
  for (const [id, q] of quotes) {
    if (new Date(q.expiresAt).getTime() < now) quotes.delete(id);
  }
}

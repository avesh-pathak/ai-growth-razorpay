// scripts/seed.ts — Seed script for reproducible demo data
// Usage: npx tsx scripts/seed.ts

import { config } from "dotenv";
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { PRODUCTS } from "../lib/data/products";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("=== SlashCheckout Seed Script ===");

  // 1. Seed products
  console.log(`Seeding ${PRODUCTS.length} products...`);
  const products = PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    brand: "Kindred Coffee Supply",
    description: p.description,
    category: p.category,
    subcategory: p.subcategory,
  }));

  const { error: prodError } = await supabase.from("products").upsert(products, { onConflict: "id" });
  if (prodError) {
    console.error("Error seeding products:", prodError.message);
  } else {
    console.log(`  ✓ ${products.length} products seeded`);
  }

  // 2. Seed SKUs
  console.log("Seeding SKUs...");
  const skus = PRODUCTS.map((p) => ({
    id: p.id,
    product_id: p.id,
    name: p.name,
    slug: p.slug,
    variant_attrs: p.attributes,
    cost_price_paise: p.costPaise,
    list_price_paise: p.pricePaise,
    margin_pct: p.marginPct,
    stock: p.stock,
    rating: p.rating,
    reviews: p.reviews,
    tags: p.badge ? [p.badge.toLowerCase()] : [],
    compatibility: [],
    pairs_with: [],
    weight: p.attributes.weight ?? null,
    dimensions: p.attributes.dimensions ?? null,
    image_url: p.image,
    badge: p.badge ?? null,
  }));

  const { error: skuError } = await supabase.from("skus").upsert(skus, { onConflict: "id" });
  if (skuError) {
    console.error("Error seeding SKUs:", skuError.message);
  } else {
    console.log(`  ✓ ${skus.length} SKUs seeded`);
  }

  // 3. Seed sample audit events
  console.log("Seeding audit events...");
  const auditEvents = [
    { actor: "buyer-agent", action: "quote.requested", entity_type: "quote", entity_id: "quote-001", payload: { sku: "p1", qty: 1 }, prev_hash: null, hash: "seed-hash-1" },
    { actor: "policy-gate", action: "evaluate", entity_type: "proposal", entity_id: "prop-001", payload: { verdict: "approved", rules: 7 }, prev_hash: "seed-hash-1", hash: "seed-hash-2" },
    { actor: "buyer-agent", action: "checkout.completed", entity_type: "order", entity_id: "order-001", payload: { total: 189900, paymentId: "pay-001" }, prev_hash: "seed-hash-2", hash: "seed-hash-3" },
    { actor: "merchant-agent", action: "proposal.blocked", entity_type: "proposal", entity_id: "prop-002", payload: { reason: "margin_floor", sku: "p7" }, prev_hash: "seed-hash-3", hash: "seed-hash-4" },
    { actor: "merchant-agent", action: "proposal.created", entity_type: "proposal", entity_id: "prop-003", payload: { items: 3, total: 1564700 }, prev_hash: "seed-hash-4", hash: "seed-hash-5" },
  ];

  const { error: auditError } = await supabase.from("audit_events").insert(auditEvents);
  if (auditError) {
    console.error("Error seeding audit events:", auditError.message);
  } else {
    console.log(`  ✓ ${auditEvents.length} audit events seeded`);
  }

  console.log("\nSeed complete.");
}

seed().catch(console.error);
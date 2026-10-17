// lib/data/products.ts — deterministic seed of SlashCheckout SKUs.
// Money is integer subunits (paise). Cost/list/margin are authoritative server-side.

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: "Brewers" | "Grinders" | "Kettles" | "Accessories" | "Beans";
  subcategory: string;
  description: string;
  pricePaise: number;       // list price
  costPaise: number;        // cost floor (margin guard)
  marginPct: number;
  stock: number;
  rating: number;
  reviews: number;
  badge?: string;
  image: string;            // placeholder gradient key
  attributes: Record<string, string>;
};

const img = (n: number) => `https://picsum.photos/seed/slashcheckout-${n}/640/640`;

export const PRODUCTS: Product[] = [
  // Brewers
  { id: "p1", slug: "v60-dripper-02", name: "V60 Dripper 02", category: "Brewers", subcategory: "Pour-over", description: "The classic cone. Ceramic, single-serve, 60° walls for clean, bright cups.", pricePaise: 189900, costPaise: 95000, marginPct: 50, stock: 42, rating: 4.8, reviews: 312, badge: "Best seller", image: img(1), attributes: { material: "Ceramic", serves: "1", weight: "320g" } },
  { id: "p2", slug: "chemex-6cup", name: "Chemex 6-Cup", category: "Brewers", subcategory: "Pour-over", description: "Borosilicate glass, wood collar. Slow, sweet, sediment-free.", pricePaise: 499900, costPaise: 260000, marginPct: 48, stock: 18, rating: 4.7, reviews: 189, image: img(2), attributes: { material: "Glass", serves: "3-6", weight: "680g" } },
  { id: "p3", slug: "aeropress-original", name: "AeroPress Original", category: "Brewers", subcategory: "Immersion", description: "Fast, forgiving, travel-ready. 80ml to 250ml in 90 seconds.", pricePaise: 349900, costPaise: 175000, marginPct: 50, stock: 60, rating: 4.9, reviews: 1204, badge: "Top rated", image: img(3), attributes: { material: "Polypropylene", serves: "1-3", weight: "180g" } },
  { id: "p4", slug: "french-press-1l", name: "French Press 1L", category: "Brewers", subcategory: "Immersion", description: "Double-wall stainless. Keeps coffee hot for an hour.", pricePaise: 279900, costPaise: 140000, marginPct: 50, stock: 25, rating: 4.5, reviews: 231, image: img(4), attributes: { material: "Stainless", serves: "4-6", weight: "720g" } },
  { id: "p5", slug: "moka-pot-6cup", name: "Moka Pot 6-Cup", category: "Brewers", subcategory: "Stovetop", description: "Aluminium, octagonal. Stovetop espresso-style, rich and syrupy.", pricePaise: 229900, costPaise: 115000, marginPct: 50, stock: 33, rating: 4.6, reviews: 412, image: img(5), attributes: { material: "Aluminium", serves: "3-6", weight: "410g" } },
  { id: "p6", slug: "kalita-wave-185", name: "Kalita Wave 185", category: "Brewers", subcategory: "Pour-over", description: "Flat-bottom dripper. Forgiving, even extraction, great for two.", pricePaise: 329900, costPaise: 165000, marginPct: 50, stock: 22, rating: 4.7, reviews: 156, image: img(6), attributes: { material: "Stainless", serves: "2", weight: "290g" } },
  // Grinders
  { id: "p7", slug: "hand-grinder-c40", name: "Hand Grinder C40", category: "Grinders", subcategory: "Manual", description: "Steel burrs, 40 settings, travel-ready. The upgrade from blade grinders.", pricePaise: 1299900, costPaise: 650000, marginPct: 50, stock: 12, rating: 4.9, reviews: 523, badge: "Editor's pick", image: img(7), attributes: { burrs: "Steel", settings: "40", weight: "620g" } },
  { id: "p8", slug: "electric-grinder-e1", name: "Electric Grinder E1", category: "Grinders", subcategory: "Electric", description: "Conical burrs, 31 settings, quiet motor. For daily home brewing.", pricePaise: 1899900, costPaise: 950000, marginPct: 50, stock: 8, rating: 4.6, reviews: 287, image: img(8), attributes: { burrs: "Conical", settings: "31", weight: "2.1kg" } },
  { id: "p9", slug: "blade-grinder-basic", name: "Blade Grinder (Basic)", category: "Grinders", subcategory: "Blade", description: "Entry-level blade grinder. Honest: uneven, but cheap and fast.", pricePaise: 89900, costPaise: 45000, marginPct: 50, stock: 50, rating: 3.9, reviews: 89, image: img(9), attributes: { type: "Blade", capacity: "50g" } },
  { id: "p10", slug: "travel-grinder-mini", name: "Travel Grinder Mini", category: "Grinders", subcategory: "Manual", description: "Pocket-sized ceramic burrs. Fits in a backpack side pocket.", pricePaise: 499900, costPaise: 250000, marginPct: 50, stock: 20, rating: 4.4, reviews: 134, image: img(10), attributes: { burrs: "Ceramic", settings: "12", weight: "280g" } },
  // Kettles
  { id: "p11", slug: "gooseneck-kettle-stagg", name: "Gooseneck Kettle — Stagg", category: "Kettles", subcategory: "Stovetop", description: "Precision pour, 1L capacity, weighted handle. The pour-over essential.", pricePaise: 699900, costPaise: 350000, marginPct: 50, stock: 15, rating: 4.8, reviews: 401, badge: "Staff pick", image: img(11), attributes: { capacity: "1L", material: "Stainless", control: "Manual" } },
  { id: "p12", slug: "electric-kettle-variable", name: "Electric Kettle (Variable)", category: "Kettles", subcategory: "Electric", description: "1°C precision, hold temp 60 min, 1.7L. Set it and forget it.", pricePaise: 899900, costPaise: 450000, marginPct: 50, stock: 10, rating: 4.7, reviews: 322, image: img(12), attributes: { capacity: "1.7L", control: "Digital", power: "1500W" } },
  { id: "p13", slug: "travel-kettle-mini", name: "Travel Kettle Mini", category: "Kettles", subcategory: "Electric", description: "0.5L, dual voltage. Hotel-room pour-over, solved.", pricePaise: 399900, costPaise: 200000, marginPct: 50, stock: 19, rating: 4.3, reviews: 98, image: img(13), attributes: { capacity: "0.5L", control: "Digital", power: "800W" } },
  // Accessories
  { id: "p14", slug: "paper-filters-v60-100", name: "V60 Paper Filters (100)", category: "Accessories", subcategory: "Filters", description: "Tabbed, oxygen-bleached. Clean cup, no paper taste.", pricePaise: 49900, costPaise: 20000, marginPct: 60, stock: 200, rating: 4.8, reviews: 670, image: img(14), attributes: { count: "100", size: "02" } },
  { id: "p15", slug: "scale-timer-a1", name: "Brew Scale + Timer A1", category: "Accessories", subcategory: "Scales", description: "0.1g precision, built-in timer, USB-C rechargeable.", pricePaise: 249900, costPaise: 125000, marginPct: 50, stock: 28, rating: 4.6, reviews: 245, image: img(15), attributes: { precision: "0.1g", max: "2kg", battery: "USB-C" } },
  { id: "p16", slug: "tamper-58mm", name: "Tamper 58mm", category: "Accessories", subcategory: "Espresso", description: "Stainless base, walnut handle. Fits standard 58mm baskets.", pricePaise: 199900, costPaise: 100000, marginPct: 50, stock: 35, rating: 4.5, reviews: 112, image: img(16), attributes: { size: "58mm", material: "Stainless/Walnut" } },
  { id: "p17", slug: "milk-pitcher-350", name: "Milk Pitcher 350ml", category: "Accessories", subcategory: "Espresso", description: "Stainless, tapered spout for latte art. 350ml capacity.", pricePaise: 129900, costPaise: 65000, marginPct: 50, stock: 44, rating: 4.4, reviews: 88, image: img(17), attributes: { capacity: "350ml", material: "Stainless" } },
  { id: "p18", slug: "cleaning-brush-set", name: "Cleaning Brush Set", category: "Accessories", subcategory: "Cleaning", description: "3-piece: group head brush, grinder brush, microfiber cloth.", pricePaise: 79900, costPaise: 35000, marginPct: 56, stock: 70, rating: 4.7, reviews: 203, image: img(18), attributes: { pieces: "3" } },
  { id: "p19", slug: "espresso-distribution-tool", name: "Distribution Tool (WDT)", category: "Accessories", subcategory: "Espresso", description: "0.3mm needles, aluminium handle. Even extraction, every shot.", pricePaise: 149900, costPaise: 75000, marginPct: 50, stock: 30, rating: 4.6, reviews: 167, image: img(19), attributes: { needles: "0.3mm", material: "Aluminium" } },
  { id: "p20", slug: "storage-canister-1l", name: "Storage Canister 1L", category: "Accessories", subcategory: "Storage", description: "Airtight, UV-blocking. Keeps beans fresh for weeks.", pricePaise: 169900, costPaise: 85000, marginPct: 50, stock: 40, rating: 4.5, reviews: 134, image: img(20), attributes: { capacity: "1L", material: "Stainless/UV" } },
  // Beans
  { id: "p21", slug: "ethiopia-yirgacheffe-250", name: "Ethiopia Yirgacheffe 250g", category: "Beans", subcategory: "Single origin", description: "Floral, bergamot, tea-like. Washed. Roasted for filter.", pricePaise: 74900, costPaise: 37500, marginPct: 50, stock: 60, rating: 4.8, reviews: 412, badge: "New", image: img(21), attributes: { origin: "Ethiopia", process: "Washed", roast: "Light" } },
  { id: "p22", slug: "colombia-huila-250", name: "Colombia Huila 250g", category: "Beans", subcategory: "Single origin", description: "Caramel, red apple, milk chocolate. Washed, medium roast.", pricePaise: 69900, costPaise: 35000, marginPct: 50, stock: 55, rating: 4.7, reviews: 356, image: img(22), attributes: { origin: "Colombia", process: "Washed", roast: "Medium" } },
  { id: "p23", slug: "brazil-santos-500", name: "Brazil Santos 500g", category: "Beans", subcategory: "Blend", description: "Nutty, low acid, chocolate. The everyday espresso base.", pricePaise: 99900, costPaise: 50000, marginPct: 50, stock: 40, rating: 4.5, reviews: 289, image: img(23), attributes: { origin: "Brazil", process: "Natural", roast: "Medium-dark" } },
  { id: "p24", slug: "decaf-swiss-water-250", name: "Decaf (Swiss Water) 250g", category: "Beans", subcategory: "Decaf", description: "Full flavour, zero caffeine. Swiss Water process.", pricePaise: 84900, costPaise: 42500, marginPct: 50, stock: 25, rating: 4.6, reviews: 178, image: img(24), attributes: { origin: "Colombia", process: "Swiss Water", roast: "Medium" } },
];

export const CATEGORIES = ["All", "Brewers", "Grinders", "Kettles", "Accessories", "Beans"] as const;

export function formatPaise(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function getProduct(slug: string) { return PRODUCTS.find((p) => p.slug === slug); }
export function getProductById(id: string) { return PRODUCTS.find((p) => p.id === id); }

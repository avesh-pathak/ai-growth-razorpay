// scripts/gen-catalog.mjs - generate additional SKU lines for lib/data/products.ts
import fs from "node:fs";

const categories = [
  { name: "Brewers", subs: ["Pour-over", "Immersion", "Stovetop", "Cold brew"], items: ["Dripper", "Brewer", "Press", "Pot", "Kettle Brewer"], priceRange: [150000, 600000], margin: 50, stock: [8, 60] },
  { name: "Grinders", subs: ["Manual", "Electric", "Blade", "Travel"], items: ["Grinder", "Burr Grinder", "Blade Grinder", "Hand Grinder"], priceRange: [89900, 2500000], margin: 50, stock: [5, 40] },
  { name: "Kettles", subs: ["Stovetop", "Electric", "Travel"], items: ["Gooseneck Kettle", "Electric Kettle", "Travel Kettle"], priceRange: [350000, 1200000], margin: 50, stock: [6, 30] },
  { name: "Accessories", subs: ["Filters", "Scales", "Espresso", "Cleaning", "Storage", "Cups"], items: ["Filter Papers", "Brew Scale", "Tamper", "Milk Pitcher", "Cleaning Brush", "Storage Canister", "Cup Set", "Distribution Tool"], priceRange: [49900, 299900], margin: 55, stock: [20, 200] },
  { name: "Beans", subs: ["Single origin", "Blend", "Decaf", "Espresso"], items: ["Coffee Beans", "Espresso Blend", "Single Origin", "Decaf Beans"], priceRange: [59900, 149900], margin: 50, stock: [20, 80] },
  { name: "Bundles", subs: ["Starter", "Pro", "Travel"], items: ["Starter Bundle", "Pro Bundle", "Travel Bundle", "Complete Setup"], priceRange: [499900, 2999900], margin: 45, stock: [5, 25] },
];

const brands = ["Kindred", "Hario", "Fellow", "Baratza", "Acaia", "Timemore", "Comandante", "Kalita"];
const materials = ["Ceramic", "Glass", "Stainless", "Aluminium", "Wood", "Plastic"];
const origins = ["Ethiopia", "Colombia", "Brazil", "Kenya", "Guatemala", "Costa Rica", "Panama"];
const processes = ["Washed", "Natural", "Honey", "Swiss Water", "Anaerobic"];
const roasts = ["Light", "Medium", "Medium-dark", "Dark"];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const existing = 24;
let idNum = existing + 1;
const lines = [];
const target = 100;
let imgNum = existing + 1;

while (idNum <= target) {
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const sub = pick(cat.subs);
  const item = pick(cat.items);
  const brand = pick(brands);
  const price = rnd(cat.priceRange[0], cat.priceRange[1]);
  // round to nearest 100 paise
  const pricePaise = Math.round(price / 100) * 100;
  const costPaise = Math.round(pricePaise * (1 - cat.margin / 100));
  const marginPct = cat.margin;
  const stock = rnd(cat.stock[0], cat.stock[1]);
  const rating = (4.0 + Math.random() * 0.9).toFixed(1);
  const reviews = rnd(10, 600);
  const name = `${brand} ${item} ${idNum}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const badge = Math.random() < 0.15 ? pick(["Best seller", "Top rated", "Editor's pick", "New", "Staff pick"]) : null;

  let attrs = {};
  if (cat.name === "Beans") {
    attrs = { origin: pick(origins), process: pick(processes), roast: pick(roasts) };
  } else if (cat.name === "Brewers") {
    attrs = { material: pick(materials), serves: pick(["1", "2", "3-6", "4-6"]), weight: `${rnd(180, 800)}g` };
  } else if (cat.name === "Grinders") {
    attrs = { burrs: pick(["Steel", "Ceramic", "Conical"]), settings: String(rnd(12, 40)), weight: `${rnd(280, 2200)}g` };
  } else if (cat.name === "Kettles") {
    attrs = { capacity: pick(["0.5L", "1L", "1.7L"]), material: pick(["Stainless", "Copper"]), control: pick(["Manual", "Digital"]) };
  } else if (cat.name === "Accessories") {
    attrs = { material: pick(materials) };
  } else {
    attrs = { pieces: String(rnd(2, 5)) };
  }

  const desc = `${item} for ${cat.name.toLowerCase()} enthusiasts. ${brand} quality.`;
  const badgeStr = badge ? `, badge: "${badge}"` : "";
  const line = `  { id: "p${idNum}", slug: "${slug}", name: "${name}", category: "${cat.name}", subcategory: "${sub}", description: "${desc}", pricePaise: ${pricePaise}, costPaise: ${costPaise}, marginPct: ${marginPct}, stock: ${stock}, rating: ${rating}, reviews: ${reviews}${badgeStr}, image: img(${imgNum}), attributes: ${JSON.stringify(attrs)} },`;
  lines.push(line);
  idNum++;
  imgNum++;
}

const out = lines.join("\n");
fs.writeFileSync("scripts/_catalog_lines.txt", out);
console.log("Generated", lines.length, "lines");

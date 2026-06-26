const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const files = [
  path.join(root, "index.ts"),
  path.join(root, "data", "curated-foods.ts")
];

const mojibakePatterns = [
  /\uFFFD/,
  /锟/,
  /绋/,
  /閿/,
  /鏂/,
  /闈/,
  /楦/
];

let hasRisk = false;

for (const file of files) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  if (!fs.existsSync(file)) {
    hasRisk = true;
    console.error(`[food-data] missing: ${relative}`);
    continue;
  }

  const text = fs.readFileSync(file, "utf8");
  const foodCount = (text.match(/\bfood\(/g) ?? []).length;
  const objectFoodCount = (text.match(/\bid:\s*"csv-/g) ?? []).length;
  const suspicious = mojibakePatterns
    .map((pattern) => (text.match(new RegExp(pattern.source, "g")) ?? []).length)
    .reduce((sum, count) => sum + count, 0);

  console.log(`[food-data] ${relative}`);
  console.log(`  food() calls: ${foodCount}`);
  console.log(`  csv objects: ${objectFoodCount}`);
  console.log(`  suspicious encoding markers: ${suspicious}`);

  if (suspicious > 0) {
    hasRisk = true;
  }

  if (relative === "data/curated-foods.ts" && objectFoodCount < 500) {
    hasRisk = true;
    console.error("  risk: generated CSV food catalog is unexpectedly small");
  }
}

if (hasRisk) {
  console.error("[food-data] health check found risks. Keep generated CSV/JSON data as the source of truth before editing Chinese food literals by hand.");
  process.exitCode = 1;
} else {
  console.log("[food-data] health check passed.");
}

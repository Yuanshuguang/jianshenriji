const fs = require("fs");
const path = require("path");

const indexPath = path.resolve(__dirname, "../../shared/index.ts");
const batch1Path = path.resolve(__dirname, "../../shared/data/review-pool/pending-cn/new-foods-batch.ts");
const batch2Path = path.resolve(__dirname, "../../shared/data/review-pool/pending-cn/new-foods-batch2.ts");
const batch3Path = path.resolve(__dirname, "../../shared/data/review-pool/pending-cn/new-foods-batch3.ts");

let content = fs.readFileSync(indexPath, "utf-8");
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

function extractFoodLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  let c = fs.readFileSync(filePath, "utf-8");
  if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1);
  const lines = c.split("\n");
  const foods = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("food(")) {
      foods.push(line); // Keep original indentation
    }
  }
  return foods;
}

const b1 = extractFoodLines(batch1Path);
const b2 = extractFoodLines(batch2Path);
const b3 = extractFoodLines(batch3Path);
const allNew = [...b1, ...b2, ...b3];
console.log("Batch 1:", b1.length, "Batch 2:", b2.length, "Batch 3:", b3.length);
console.log("Total new:", allNew.length);

// Collect existing IDs
const existingIds = new Set();
const foodIdRegex = /food\("([^"]+)"/g;
let match;
while ((match = foodIdRegex.exec(content)) !== null) {
  existingIds.add(match[1]);
}
console.log("Existing IDs:", existingIds.size);

// Dedupe
const toInsert = [];
const dupes = [];
const seen = new Set();
for (const line of allNew) {
  const idMatch = line.match(/food\("([^"]+)"/);
  if (!idMatch) continue;
  const id = idMatch[1];
  if (existingIds.has(id) || seen.has(id)) {
    dupes.push(id);
  } else {
    toInsert.push(line);
    seen.add(id);
  }
}
console.log("Duplicates:", dupes.length);
console.log("Inserting:", toInsert.length);

// Insert before ];
const indexLines = content.split("\n");
let lastFoodLine = -1;
for (let i = 0; i < indexLines.length; i++) {
  if (indexLines[i].trim().startsWith("food(")) lastFoodLine = i;
}
let closingLine = -1;
for (let i = lastFoodLine; i < indexLines.length; i++) {
  if (indexLines[i].trim() === "];") { closingLine = i; break; }
}
console.log("Last food:", lastFoodLine + 1, "Closing:", closingLine + 1);

const before = indexLines.slice(0, closingLine).join("\n");
const after = indexLines.slice(closingLine).join("\n");
const insertText = "\n  // === 大规模补全 (" + toInsert.length + " 种) ===\n" + toInsert.join("\n") + "\n";
const result = before + insertText + after;

// Write raw bytes to preserve existing encoding
const buf = Buffer.from(result, "utf-8");
fs.writeFileSync(indexPath, buf);
console.log("Done! " + buf.length + " bytes written");

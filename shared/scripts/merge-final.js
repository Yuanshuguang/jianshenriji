const fs = require("fs");

const indexPath = "C:/Users/Administrator/Documents/健身日历/shared/index.ts";
const batch1Path = "C:/Users/Administrator/Documents/健身日历/shared/data/new-foods-batch.ts";
const batch2Path = "C:/Users/Administrator/Documents/健身日历/shared/data/new-foods-batch2.ts";
const batch3Path = "C:/Users/Administrator/Documents/健身日历/shared/data/new-foods-batch3.ts";

// Read original as binary buffer (preserves exact bytes)
const origBuf = fs.readFileSync(indexPath);
let content = origBuf.toString("utf-8");

// Extract food lines from batch files
function readFoodLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const buf = fs.readFileSync(filePath);
  const text = buf.toString("utf-8");
  return text.split("\n").map(l => l.trimEnd()).filter(l => l.trimStart().startsWith("food("));
}

const batch1 = readFoodLines(batch1Path);
const batch2 = readFoodLines(batch2Path);
const batch3 = readFoodLines(batch3Path);
const allNew = [...batch1, ...batch2, ...batch3];
console.log("B1:", batch1.length, "B2:", batch2.length, "B3:", batch3.length);

// Get existing IDs
const existingIds = new Set();
const foodIdRegex = /food\("([^"]+)"/g;
let match;
while ((match = foodIdRegex.exec(content)) !== null) {
  existingIds.add(match[1]);
}

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
    // Fix any missing ] in alias
    let fixed = line;
    const sqOpen = (fixed.match(/\[/g) || []).length;
    const sqClose = (fixed.match(/\]/g) || []).length;
    if (sqOpen > sqClose) {
      // Missing closing square bracket, add before category string
      fixed = fixed.replace(/, "([a-z]+)"/, '], ""');
      console.log("  Fixed brackets in:", id);
    }
    toInsert.push(fixed);
    seen.add(id);
  }
}
console.log("Duplicates:", dupes.length);
console.log("Inserting:", toInsert.length);

// Insert
const lines = content.split("\n");
let lastFoodIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trimStart().startsWith("food(")) lastFoodIdx = i;
}
let closeIdx = -1;
for (let i = lastFoodIdx; i < lines.length; i++) {
  if (lines[i].trim() === "];") { closeIdx = i; break; }
}
console.log("Inserting before line", closeIdx + 1);

const before = lines.slice(0, closeIdx).join("\n");
const after = lines.slice(closeIdx).join("\n");
const insertText = "\n  // === 大规模补全 (" + toInsert.length + " 种) ===\n" + toInsert.join("\n") + "\n";
const result = before + insertText + after;

// Write as raw bytes to preserve encoding
fs.writeFileSync(indexPath, Buffer.from(result, "utf-8"));
console.log("Done!");
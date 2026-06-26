// merge-round2.js — merge batch2 and batch3 into shared/index.ts
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../../shared/index.ts');
const batch2Path = path.resolve(__dirname, '../../shared/data/new-foods-batch2.ts');
const batch3Path = path.resolve(__dirname, '../../shared/data/new-foods-batch3.ts');

let lines = fs.readFileSync(indexPath, 'utf-8').split('\n');

// Read both batch files
const batch2Content = fs.readFileSync(batch2Path, 'utf-8');
const batch3Content = fs.readFileSync(batch3Path, 'utf-8');

// Extract food() calls from both files
function extractFoods(content) {
  const foodLines = content.split('\n');
  const blocks = [];
  let current = [];
  for (const line of foodLines) {
    const trimmed = line.trimEnd();
    if (trimmed.match(/^\s*food\(/) || (current.length > 0)) {
      current.push(line);
      if (trimmed.endsWith('),')) {
        blocks.push(current.join('\n'));
        current = [];
      }
    }
  }
  return blocks;
}

const batch2Foods = extractFoods(batch2Content);
const batch3Foods = extractFoods(batch3Content);
const allNew = [...batch2Foods, ...batch3Foods];
console.log("Batch 2: " + batch2Foods.length + " foods");
console.log("Batch 3: " + batch3Foods.length + " foods");
console.log("Total new: " + allNew.length + " foods");

// Check duplicates
const existingIds = new Set();
const foodIdRegex = /food\("([^"]+)"/g;
let match;
const fullContent = lines.join('\n');
while ((match = foodIdRegex.exec(fullContent)) !== null) {
  existingIds.add(match[1]);
}

const toInsert = [];
const dupes = [];
for (const block of allNew) {
  const idMatch = block.match(/food\("([^"]+)"/);
  if (idMatch && existingIds.has(idMatch[1])) {
    dupes.push(idMatch[1]);
  } else {
    toInsert.push(block);
    if (idMatch) existingIds.add(idMatch[1]); // Prevent dupes within batch
  }
}
console.log("Skipping " + dupes.length + " duplicates: " + (dupes.length > 0 ? dupes.join(', ') : 'none'));
console.log("Inserting " + toInsert.length + " new foods");

// Find closing ]; of foods array
let lastFoodLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().match(/^\s*food\(/)) lastFoodLine = i;
}
let closingLine = -1;
for (let i = lastFoodLine; i < lines.length; i++) {
  if (lines[i].trim() === '];') { closingLine = i; break; }
}
console.log("Inserting before line " + (closingLine + 1));

const insertCode = '\n  // === Round 2: 402 种新食物（饮品/汤/炒菜/小吃/零食/调味品） ===\n' + toInsert.join('\n') + '\n';
const before = lines.slice(0, closingLine).join('\n');
const after = lines.slice(closingLine).join('\n');
const result = before + insertCode + '\n' + after;

fs.writeFileSync(indexPath, result, 'utf-8');
console.log("Done!");

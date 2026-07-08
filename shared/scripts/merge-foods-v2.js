// merge-foods-v2.ts — correctly insert before foods array ];
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../../shared/index.ts');
const newFoodsPath = path.resolve(__dirname, '../../shared/data/review-pool/pending-cn/new-foods-batch.ts');

let lines = fs.readFileSync(indexPath, 'utf-8').split('\n');
const newFoodsContent = fs.readFileSync(newFoodsPath, 'utf-8');

// Parse new foods blocks
const foodLines = newFoodsContent.split('\n');
const newFoodBlocks = [];
let currentBlock = [];
for (const line of foodLines) {
  const trimmed = line.trimEnd();
  if (trimmed.match(/^\s*food\(/) || (currentBlock.length > 0 && !trimmed.match(/^\s*\/\//))) {
    currentBlock.push(line);
    if (trimmed.endsWith('),')) {
      newFoodBlocks.push(currentBlock.join('\n'));
      currentBlock = [];
    }
  }
}
console.log("Found " + newFoodBlocks.length + " new food blocks");

// Collect existing food IDs
const existingIds = new Set();
const foodIdRegex = /food\("([^"]+)"/g;
let match;
const fullContent = lines.join('\n');
while ((match = foodIdRegex.exec(fullContent)) !== null) {
  existingIds.add(match[1]);
}

// Dedupe
const insertBlocks = [];
const dupes = [];
for (const block of newFoodBlocks) {
  const idMatch = block.match(/food\("([^"]+)"/);
  if (idMatch && existingIds.has(idMatch[1])) {
    dupes.push(idMatch[1]);
  } else {
    insertBlocks.push(block);
  }
}
console.log("Skipping " + dupes.length + " duplicates: " + (dupes.length > 0 ? dupes.join(', ') : 'none'));
console.log("Inserting " + insertBlocks.length + " new foods");

// Find the correct ]; — the one that closes foods array
// Strategy: find the line before ]; that is part of foods array
// foods array starts with "export const foods: Food[] = ["
let foodsStartLine = -1;
let foodsEndLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const foods:')) {
    foodsStartLine = i;
  }
  if (foodsStartLine >= 0 && lines[i].trim() === '];') {
    // Check if this ]; is right after the foods array or further down
    // The foods array ]; is followed by an empty line then other exports
    foodsEndLine = i;
    break; // Take the first ]; after foods declaration
  }
}

// More precise: find the ]; that follows the last food() line
let lastFoodLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('food(') || lines[i].trim().match(/^\s+food\(/)) {
    lastFoodLine = i;
  }
}
console.log("Last food() at line: " + (lastFoodLine + 1));

// Find the ]; that comes after lastFoodLine
let closingLine = -1;
for (let i = lastFoodLine; i < lines.length; i++) {
  if (lines[i].trim() === '];') {
    closingLine = i;
    break;
  }
}
console.log("Closing ]; at line: " + (closingLine + 1));

// Insert before the closing ];
const insertCode = '\n  // === L1 基础补齐（306 种新食物） ===\n' + insertBlocks.join('\n') + '\n';
const before = lines.slice(0, closingLine).join('\n');
const after = lines.slice(closingLine).join('\n');
const result = before + insertCode + '\n' + after;

fs.writeFileSync(indexPath, result, 'utf-8');
console.log("Done! Written to " + indexPath);

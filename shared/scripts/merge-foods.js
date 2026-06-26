// merge-foods.ts — 将 new-foods-batch.ts 的数据合并到 shared/index.ts
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../../shared/index.ts');
const newFoodsPath = path.resolve(__dirname, '../../shared/data/new-foods-batch.ts');

let indexContent = fs.readFileSync(indexPath, 'utf-8');
const newFoodsContent = fs.readFileSync(newFoodsPath, 'utf-8');

// 提取所有 food() 调用
const foodLines = newFoodsContent
  .split('\n')
  .map(l => l.trimEnd())
  .filter(l => l.trim());

// 收集需要插入的 food 条目（跳过注释和空行）
const newFoodBlocks = [];
let currentBlock = [];
let inComment = false;

for (const line of foodLines) {
  if (line.startsWith('//') || line.startsWith('/*')) {
    if (!line.startsWith('// ===') && !line.startsWith('// 食物')) {
      // section comments are allowed
    }
    continue;
  }
  if (line.startsWith('food(') || currentBlock.length > 0 || line.match(/^\s+food\(/)) {
    currentBlock.push(line);
    if (line.trim().endsWith('),')) {
      newFoodBlocks.push(currentBlock.join('\n'));
      currentBlock = [];
    }
  } else if (line.trim().endsWith('),') && currentBlock.length > 0) {
    currentBlock.push(line);
    newFoodBlocks.push(currentBlock.join('\n'));
    currentBlock = [];
  }
}

console.log("Found " + newFoodBlocks.length + " food() blocks to insert");

// 在最后一个 food() 条目之前插入（找到 ]; 之前的最后一个 food 条目）
const foodsCloseIdx = indexContent.lastIndexOf('];');
if (foodsCloseIdx < 0) {
  console.error('Cannot find foods array closing ];');
  process.exit(1);
}

// 检查是否有重复
const existingIds = new Set();
const foodIdRegex = /food\("([^"]+)"/g;
let match;
while ((match = foodIdRegex.exec(indexContent)) !== null) {
  existingIds.add(match[1]);
}

const duplicateIds = [];
const insertBlocks = [];
for (const block of newFoodBlocks) {
  const idMatch = block.match(/food\("([^"]+)"/);
  if (idMatch && existingIds.has(idMatch[1])) {
    duplicateIds.push(idMatch[1]);
    continue;
  }
  insertBlocks.push(block);
}

console.log("Skipping " + duplicateIds.length + " duplicates: " + (duplicateIds.length > 0 ? duplicateIds.join(', ') : 'none'));
console.log("Inserting " + insertBlocks.length + " new foods");

// 插入到 ]; 之前
const insertCode = '\n\n  // === 自动补全 ===\n' + insertBlocks.join('\n') + '\n';
const before = indexContent.slice(0, foodsCloseIdx);
const after = indexContent.slice(foodsCloseIdx);
const newContent = before + insertCode + after;

fs.writeFileSync(indexPath, newContent, 'utf-8');
console.log("Done! Written to " + indexPath);

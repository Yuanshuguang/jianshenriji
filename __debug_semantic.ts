import { parseFoodSemantics } from "./features/food-semantic-parser";

const semantic = parseFoodSemantics("下午茶喝了3杯3勺蛋白粉，一碗螺蛳粉，神秘太空食物");
const tokens = semantic.tokens.filter(t => t.role === "quantity");
console.log("Quantity tokens:", JSON.stringify(tokens.map(t => ({text: t.text, q: t.quantity, u: t.unit}))));

const r2 = parseFoodSemantics("3杯3勺蛋白粉");
const t2 = r2.tokens.filter(t => t.role === "quantity");
console.log("Simple version:", JSON.stringify(t2.map(t => ({text: t.text, q: t.quantity, u: t.unit}))));

process.exit(0);

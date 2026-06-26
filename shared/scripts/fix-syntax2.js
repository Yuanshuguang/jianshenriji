const fs = require("fs");
const indexPath = "C:/Users/Administrator/Documents/健身日历/shared/index.ts";
let lines = fs.readFileSync(indexPath, "utf-8").split("\n");
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim().startsWith("food(")) continue;
  const openSq = (line.match(/\[/g) || []).length;
  const closeSq = (line.match(/\]/g) || []).length;
  if (openSq !== closeSq) {
    console.log("Line " + (i+1) + " unbalanced: [=" + openSq + " ]=" + closeSq);
    console.log("  " + line.substring(0, 120));
    // Fix: add missing ]
    if (openSq > closeSq) {
      // Find last alias string and add ] after it before category
      const fixedLine = line.replace(/, "([a-z]+)"/, '], ""');
      lines[i] = fixedLine;
      fixed++;
    }
  }
}
fs.writeFileSync(indexPath, lines.join("\n"), "utf-8");
console.log("Total fixed:", fixed);
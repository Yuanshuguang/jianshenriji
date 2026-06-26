const fs = require("fs");
const indexPath = "C:/Users/Administrator/Documents/健身日历/shared/index.ts";
let lines = fs.readFileSync(indexPath, "utf-8").split("\n");
let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Find food() lines where alias array ] is missing
  // Pattern: ... ["list-without-closing", "category" ...
  const match = line.match(/^\s+food\("([^"]+)",\s+"([^"]+)",\s+\[([^\]]*)\]\s*,\s*"([^"]+)"/);
  if (!match && line.trim().startsWith("food(")) {
    // This line might be broken — alias ] is missing
    // Try to detect: ["..." ..., "dish"/"protein"/etc without ]
    // Replace: add ] after the last alias before category string
    const broken = line.match(/^\s+food\("([^"]+)",\s+"([^"]+)",\s+\[(.+?), "([a-z]+)"/);
    if (broken) {
      const beforeAliasEnd = broken[3];
      const category = broken[4];
      // Check if beforeAliasEnd is just one alias (no comma)
      if (!beforeAliasEnd.includes(",")) {
        // Single alias with missing ]
        lines[i] = line.replace(', "' + category + '"', '], "' + category + '"');
        fixed++;
        console.log("Fixed line " + (i+1) + ": single alias");
      }
    }
  }
}
fs.writeFileSync(indexPath, lines.join("\n"), "utf-8");
console.log("Total fixed:", fixed);
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MAX_LINES = 350;
const DIRS = ["src", "scripts"];
const EXTENSIONS = new Set([".ts", ".js", ".mjs"]);

let totalFiles = 0;
const violations = [];

function checkDirectory(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      checkDirectory(fullPath);
    } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name)) && !entry.name.endsWith(".d.ts")) {
      totalFiles++;
      const content = readFileSync(fullPath, "utf8");
      const lines = content.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n").length;
      if (lines > MAX_LINES) {
        violations.push({
          file: relative(ROOT, fullPath),
          lines,
          limit: MAX_LINES,
        });
      }
    }
  }
}

for (const dir of DIRS) {
  try {
    checkDirectory(join(ROOT, dir));
  } catch {
    // skip if dir does not exist
  }
}

if (violations.length > 0) {
  console.error(`❌ Line budget check FAILED: ${violations.length} files exceed ${MAX_LINES} lines:`);
  for (const v of violations) {
    console.error(`  - ${v.file}: ${v.lines} lines (limit: ${v.limit})`);
  }
  process.exit(1);
} else {
  console.log(`✅ Line budget check PASSED: all ${totalFiles} files <= ${MAX_LINES} lines`);
}

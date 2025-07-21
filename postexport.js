// postexport.js
const fs = require("fs");
const path = require("path");

const files = ["index.html"];
const from = path.join(__dirname, "public");
const to = path.join(__dirname, "dist");

if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });

for (const file of files) {
  const src = path.join(from, file);
  const dest = path.join(to, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✅ Copied ${file}`);
  } else {
    console.warn(`⚠️ File not found: ${file}`);
  }
}

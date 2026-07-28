import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "assets", "images");

function walk(d, exts, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && e.name !== "node_modules") walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const refs = new Set();
const re = /(?:src|srcset|href|url\(|content)=["']?\.?\/?assets\/images\/([^"')\s?#]+)/gi;
const re2 = /assets\/images\/([a-zA-Z0-9./_-]+)/g;

for (const file of walk(ROOT, [".html", ".js", ".scss"])) {
  const c = fs.readFileSync(file, "utf8");
  let m;
  while ((m = re.exec(c))) refs.add(m[1].split("?")[0]);
  while ((m = re2.exec(c))) {
    const v = m[1];
    if (!v.includes("+") && !v.includes("${")) refs.add(v.split("?")[0]);
  }
}

const missing = [];
for (const ref of [...refs].sort()) {
  if (ref.includes("+") || ref.includes("'")) continue;
  const abs = path.join(IMG, ref.replace(/\//g, path.sep));
  if (!fs.existsSync(abs)) missing.push(ref);
}

console.log("Missing refs:", missing.length);
missing.forEach((x) => console.log(" -", x));

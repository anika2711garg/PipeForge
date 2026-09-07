import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

const dir = "verifier/tests";
const files = fs
  .readdirSync(dir)
  .filter((n) => n.includes(".test."))
  .sort()
  .map((n) => path.join("verifier", "tests", n).replaceAll("\\", "/"));
const out = Object.fromEntries(
  files.map((rel) => [rel, crypto.createHash("sha256").update(fs.readFileSync(rel)).digest("hex")]),
);
fs.writeFileSync("verifier/test_hashes.json", `${JSON.stringify(out, null, 2)}\n`);
console.log(out);

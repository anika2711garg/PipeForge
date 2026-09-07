import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(root, "workspace");
fs.rmSync(workspace, { recursive: true, force: true });
console.log("Removed workspace/ (Env2 disposable state only).");

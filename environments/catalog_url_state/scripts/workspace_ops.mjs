import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function initFrom(kind) {
  const source = path.join(root, kind);
  const workspace = path.join(root, "workspace");
  if (!fs.existsSync(source)) {
    throw new Error(`Missing ${kind} tree at ${source}`);
  }
  fs.rmSync(workspace, { recursive: true, force: true });
  fs.mkdirSync(workspace, { recursive: true });
  fs.cpSync(source, workspace, { recursive: true });
  const fixture = path.join(root, "fixtures", "products.json");
  const dataDir = path.join(workspace, "src", "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.copyFileSync(fixture, path.join(dataDir, "products.json"));
  return workspace;
}

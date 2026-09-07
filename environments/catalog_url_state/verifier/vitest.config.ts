import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: {
      "@workspace": path.join(root, "workspace", "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./verifier/setup.ts"],
    include: ["./verifier/tests/**/*.test.ts", "./verifier/tests/**/*.test.tsx"],
    reporters: ["default"],
  },
});

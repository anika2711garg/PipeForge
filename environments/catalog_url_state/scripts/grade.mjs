import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(root, "workspace");
const verifierDir = path.join(root, "verifier");
const resultsDir = path.join(root, "grader", "results");
const reportPath = path.join(root, "grader_report.md");
const jsonPath = path.join(resultsDir, "latest.json");
const canary = fs.readFileSync(path.join(verifierDir, "canary.txt"), "utf8").trim();
const mandatory = JSON.parse(fs.readFileSync(path.join(verifierDir, "mandatory_tests.json"), "utf8"));
const hashPath = path.join(verifierDir, "test_hashes.json");

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function collectTestFiles() {
  const dir = path.join(verifierDir, "tests");
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".test.ts") || name.endsWith(".test.tsx"))
    .map((name) => path.join("verifier", "tests", name))
    .sort();
}

function ensureHashes() {
  const files = collectTestFiles();
  const current = Object.fromEntries(files.map((rel) => [rel.replaceAll("\\", "/"), sha256(path.join(root, rel))]));
  if (!fs.existsSync(hashPath)) {
    fs.writeFileSync(hashPath, `${JSON.stringify(current, null, 2)}\n`);
    return { ok: true, current };
  }
  const expected = JSON.parse(fs.readFileSync(hashPath, "utf8"));
  const ok = JSON.stringify(expected) === JSON.stringify(current);
  return { ok, current, expected };
}

function workspaceContainsCanary() {
  const stack = [workspace];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules") continue;
        stack.push(full);
      } else if (/\.(ts|tsx|js|jsx|json|md|txt)$/i.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8");
        if (text.includes(canary)) return true;
      }
    }
  }
  return false;
}

function writeOutputs({ status, exitCode, detail, vitest }) {
  fs.mkdirSync(resultsDir, { recursive: true });
  const payload = {
    status,
    exitCode,
    generated_at: new Date().toISOString(),
    environment: "catalog_url_state",
    workspace,
    detail,
    vitest,
    mandatory,
  };
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  const md = [
    "# Grader report — Environment 2 (catalog URL state)",
    "",
    `Overall status: **${status}**`,
    "",
    `Command: \`npm run grade\` (from \`environments/catalog_url_state\`)`,
    `Generated: ${payload.generated_at}`,
    `Workspace: \`${workspace}\``,
    "",
    "## Trust boundary",
    "",
    "- Candidate may modify `workspace/` (initialized from `starter/`).",
    "- Authoritative tests live in `verifier/` and are executed by `scripts/grade.mjs`.",
    "- A candidate script that prints PASS is ignored.",
    "- This checkout is writable; hashes detect in-tree verifier edits but are not a sandbox.",
    "",
    "## Result detail",
    "",
    "```",
    detail,
    "```",
    "",
    "## Vitest summary",
    "",
    "```json",
    JSON.stringify(vitest, null, 2),
    "```",
    "",
  ].join("\n");
  fs.writeFileSync(reportPath, md);
}

function main() {
  if (!fs.existsSync(path.join(workspace, "src"))) {
    writeOutputs({
      status: "ERROR",
      exitCode: 2,
      detail: "workspace/ missing. Run: npm run init:starter",
      vitest: null,
    });
    console.error("ERROR: workspace missing. Run npm run init:starter");
    process.exit(2);
  }

  if (workspaceContainsCanary()) {
    writeOutputs({
      status: "FAIL",
      exitCode: 1,
      detail: "Grader canary token found inside workspace/",
      vitest: null,
    });
    console.error("FAIL: canary present in workspace");
    process.exit(1);
  }

  const hashes = ensureHashes();
  if (!hashes.ok) {
    writeOutputs({
      status: "FAIL",
      exitCode: 1,
      detail: "verifier test hashes mismatch (test tampering or drift)",
      vitest: { test_hashes_ok: false },
    });
    console.error("FAIL: verifier test hash mismatch");
    process.exit(1);
  }

  const jsonOut = path.join(resultsDir, "vitest.json");
  fs.mkdirSync(resultsDir, { recursive: true });
  const run = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vitest", "run", "--config", "verifier/vitest.config.ts", "--reporter=json", "--outputFile", jsonOut],
    { cwd: root, encoding: "utf8", shell: process.platform === "win32" },
  );

  let vitest = { exitCode: run.status, stdout_tail: (run.stdout || "").slice(-2000), stderr_tail: (run.stderr || "").slice(-2000) };
  if (fs.existsSync(jsonOut)) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
      vitest = {
        exitCode: run.status,
        numTotalTests: raw.numTotalTests,
        numPassedTests: raw.numPassedTests,
        numFailedTests: raw.numFailedTests,
        numPendingTests: raw.numPendingTests,
        success: raw.success,
        test_hashes_ok: true,
      };
    } catch (error) {
      writeOutputs({
        status: "ERROR",
        exitCode: 2,
        detail: `Invalid vitest JSON: ${error}`,
        vitest,
      });
      process.exit(2);
    }
  }

  if (run.status !== 0 && !fs.existsSync(jsonOut)) {
    writeOutputs({
      status: "ERROR",
      exitCode: 2,
      detail: `Vitest failed to produce results.\n${run.stdout}\n${run.stderr}`,
      vitest,
    });
    console.error("ERROR: vitest did not produce results");
    process.exit(2);
  }

  if (!vitest.numTotalTests || vitest.numTotalTests < mandatory.length) {
    writeOutputs({
      status: "ERROR",
      exitCode: 2,
      detail: `Fail-closed: expected tests to execute; got ${vitest.numTotalTests ?? 0}`,
      vitest,
    });
    console.error("ERROR: insufficient tests executed");
    process.exit(2);
  }

  if (vitest.numPendingTests > 0) {
    writeOutputs({
      status: "FAIL",
      exitCode: 1,
      detail: "Mandatory tests were skipped/pending",
      vitest,
    });
    console.error("FAIL: pending tests");
    process.exit(1);
  }

  if (run.status === 0 && vitest.numFailedTests === 0) {
    writeOutputs({
      status: "PASS",
      exitCode: 0,
      detail: "All catalog URL-state checks passed.",
      vitest,
    });
    console.log("PASS");
    process.exit(0);
  }

  writeOutputs({
    status: "FAIL",
    exitCode: 1,
    detail: "One or more behavioral checks failed.",
    vitest,
  });
  console.error("FAIL");
  process.exit(1);
}

main();

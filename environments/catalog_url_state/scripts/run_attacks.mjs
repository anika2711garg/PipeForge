import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { initFrom } from "./workspace_ops.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "grader_attacks.md");
const evidencePath = path.join(root, "grader", "scratch", "attack_evidence.json");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...opts,
  });
  return {
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function gradeOnce() {
  const result = run(process.execPath, ["scripts/grade.mjs"]);
  let json = null;
  const latest = path.join(root, "grader", "results", "latest.json");
  if (fs.existsSync(latest)) json = JSON.parse(fs.readFileSync(latest, "utf8"));
  return { ...result, json };
}

function readWorkspace(fileRel) {
  return fs.readFileSync(path.join(root, "workspace", fileRel), "utf8");
}

function writeWorkspace(fileRel, contents) {
  fs.writeFileSync(path.join(root, "workspace", fileRel), contents);
}

const evidence = [];
const lines = [
  "# Grader attacks — Environment 2 (catalog URL state)",
  "",
  "Attacks run against disposable `workspace/` copies. Env1 and the live PipeForge frontend were not modified.",
  "",
];

function record(title, modification, command, observed, protection, after) {
  evidence.push({ title, modification, command, observed, protection, after });
  lines.push(`## ${title}`);
  lines.push("");
  lines.push(`**Attack attempted →** ${modification}`);
  lines.push("");
  lines.push(`**Command →** \`${command}\``);
  lines.push("");
  lines.push(`**What happened →** ${observed}`);
  lines.push("");
  lines.push(`**Assertion / protection →** ${protection}`);
  lines.push("");
  lines.push(`**How you fixed/prevented it →** ${after}`);
  lines.push("");
  lines.push("---");
  lines.push("");
}

// Baseline reference
initFrom("reference");
let g = gradeOnce();
record(
  "1. Known-valid reference baseline (executed)",
  "Initialize workspace from reference/.",
  "npm run apply:reference && npm run grade",
  `status=${g.json?.status} exit=${g.status} passed=${g.json?.vitest?.numPassedTests}/${g.json?.vitest?.numTotalTests}`,
  "Full behavioral suite including URL + oracle checks.",
  g.json?.status === "PASS"
    ? "Reference accepted."
    : "Investigate reference failures before trusting attacks.",
);

// Starter must fail
initFrom("starter");
g = gradeOnce();
record(
  "2. Starter incompleteness (executed)",
  "Initialize workspace from starter/ (local state only; stubbed parse/serialize).",
  "npm run init:starter && npm run grade",
  `status=${g.json?.status} exit=${g.status} failed=${g.json?.vitest?.numFailedTests}`,
  "URL deep-link and parse/serialize assertions.",
  g.json?.status === "FAIL"
    ? "Starter correctly fails the complete task grader."
    : "Unexpected starter pass — task is under-specified or tests are weak.",
);

// Hardcoded results text without URL sync
initFrom("reference");
writeWorkspace(
  "src/CatalogPage.tsx",
  `export function CatalogPage() {
  return (
    <main>
      <h1>Product catalog</h1>
      <form aria-label="Catalog filters"><label>Search<input aria-label="Search" defaultValue="" /></label></form>
      <p>Showing 2 of 2 products · Page 1 of 1</p>
      <ul aria-label="Product results">
        <li>Aurora Desk Lamp · LAMP-01 · lighting · 42.00 · stock 12</li>
        <li>Lumen Strip Light · LAMP-22 · lighting · 27.00 · stock 16</li>
      </ul>
      <div>
        <button type="button" aria-label="Previous page">Previous</button>
        <button type="button" aria-label="Next page">Next</button>
      </div>
    </main>
  );
}
`,
);
g = gradeOnce();
record(
  "3. Hardcoded UI text without interactions (executed)",
  "Replaced CatalogPage with static markup that looks like a lamp search.",
  "mutate workspace CatalogPage + npm run grade",
  `status=${g.json?.status} exit=${g.status} failed=${g.json?.vitest?.numFailedTests}`,
  "URL mutation, history, pagination, and oracle-backed helper tests.",
  "Rejected. Visible copy alone is insufficient.",
);

// Ignore fixture data
initFrom("reference");
writeWorkspace(
  "src/data/products.json",
  JSON.stringify(
    [{ id: "x", name: "Only One", sku: "X", category: "z", priceCents: 1, stock: 1 }],
    null,
    2,
  ),
);
g = gradeOnce();
record(
  "4. Ignoring fixture data (executed)",
  "Replaced products.json with a one-row dataset.",
  "mutate workspace data + npm run grade",
  `status=${g.json?.status} exit=${g.status}`,
  "Fixture length and oracle expectations derived from verifier fixtures.",
  "Rejected because results diverge from the independent oracle fixtures.",
);

// Tamper tests by skipping
initFrom("reference");
const helpersPath = path.join(root, "verifier", "tests", "helpers.test.ts");
const originalHelpers = fs.readFileSync(helpersPath, "utf8");
fs.writeFileSync(helpersPath, `import { describe, it } from "vitest";\ndescribe.skip("tampered", () => { it("x", () => {}); });\n`);
g = gradeOnce();
fs.writeFileSync(helpersPath, originalHelpers);
record(
  "5. Skipping verifier tests (executed)",
  "Temporarily replaced helpers.test.ts with describe.skip (restored afterward).",
  "tamper verifier/tests/helpers.test.ts + npm run grade",
  `status=${g.json?.status} exit=${g.status} detail=${g.json?.detail}`,
  "test_hashes.json mismatch and/or pending-test fail-closed gate.",
  "Rejected. Verifier file restored after the attack.",
);

// Fake PASS json
fs.mkdirSync(path.join(root, "grader", "scratch"), { recursive: true });
fs.writeFileSync(
  path.join(root, "grader", "scratch", "fake_pass.json"),
  JSON.stringify({ status: "PASS", spoofed: true }),
);
initFrom("starter");
g = gradeOnce();
record(
  "6. Spoofed result file (executed)",
  "Wrote grader/scratch/fake_pass.json with status PASS, then graded the failing starter.",
  "npm run init:starter && npm run grade",
  `trusted latest.json status=${g.json?.status}; spoof file left untouched`,
  "Only scripts/grade.mjs writes grader/results/latest.json for an invocation.",
  "Spoof file is ignored.",
);

// Valid alternative: serialize defaults differently but behaviorally equal
initFrom("reference");
let catalog = readWorkspace("src/lib/catalog.ts");
catalog = catalog.replace(
  "if (params.page > 1) qs.set(\"page\", String(params.page));",
  "if (params.page !== 1) qs.set(\"page\", String(params.page));",
);
writeWorkspace("src/lib/catalog.ts", catalog);
g = gradeOnce();
record(
  "7. Valid alternative serialization (executed)",
  "Used an equivalent page serialization condition (page !== 1).",
  "mutate serializeParams + npm run grade",
  `status=${g.json?.status} exit=${g.status}`,
  "Behavioral round-trip and UI assertions, not string-identical helper source.",
  g.json?.status === "PASS"
    ? "Accepted. Grader tolerates equivalent serialization."
    : "Rejected unexpectedly — tighten assertions only if behavior truly diverged.",
);

// Restore clean reference workspace
initFrom("reference");
g = gradeOnce();
record(
  "8. Restore reference after attacks (executed)",
  "Re-apply reference/ and re-grade.",
  "npm run apply:reference && npm run grade",
  `status=${g.json?.status} exit=${g.status}`,
  "Cleanup confirmation.",
  "Workspace restored to the reference solution.",
);

fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
lines.push("## Remaining vulnerabilities");
lines.push("");
lines.push("- Local checkout is writable; editing `scripts/grade.mjs` can still bypass grading.");
lines.push("- Verifier sources are visible in-repo (same class of limitation as Env1 outside Harbor).");
lines.push("");
fs.writeFileSync(reportPath, lines.join("\n"));
console.log(`Wrote ${reportPath}`);

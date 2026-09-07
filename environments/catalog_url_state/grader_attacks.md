# Grader attacks — Environment 2 (catalog URL state)

Attacks run against disposable `workspace/` copies. Env1 and the live PipeForge frontend were not modified.

## 1. Known-valid reference baseline (executed)

**Attack attempted →** Initialize workspace from reference/.

**Command →** `npm run apply:reference && npm run grade`

**What happened →** status=PASS exit=0 passed=12/12

**Assertion / protection →** Full behavioral suite including URL + oracle checks.

**How you fixed/prevented it →** Reference accepted.

---

## 2. Starter incompleteness (executed)

**Attack attempted →** Initialize workspace from starter/ (local state only; stubbed parse/serialize).

**Command →** `npm run init:starter && npm run grade`

**What happened →** status=FAIL exit=1 failed=11

**Assertion / protection →** URL deep-link and parse/serialize assertions.

**How you fixed/prevented it →** Starter correctly fails the complete task grader.

---

## 3. Hardcoded UI text without interactions (executed)

**Attack attempted →** Replaced CatalogPage with static markup that looks like a lamp search.

**Command →** `mutate workspace CatalogPage + npm run grade`

**What happened →** status=FAIL exit=1 failed=7

**Assertion / protection →** URL mutation, history, pagination, and oracle-backed helper tests.

**How you fixed/prevented it →** Rejected. Visible copy alone is insufficient.

---

## 4. Ignoring fixture data (executed)

**Attack attempted →** Replaced products.json with a one-row dataset.

**Command →** `mutate workspace data + npm run grade`

**What happened →** status=FAIL exit=1

**Assertion / protection →** Fixture length and oracle expectations derived from verifier fixtures.

**How you fixed/prevented it →** Rejected because results diverge from the independent oracle fixtures.

---

## 5. Skipping verifier tests (executed)

**Attack attempted →** Temporarily replaced helpers.test.ts with describe.skip (restored afterward).

**Command →** `tamper verifier/tests/helpers.test.ts + npm run grade`

**What happened →** status=FAIL exit=1 detail=verifier test hashes mismatch (test tampering or drift)

**Assertion / protection →** test_hashes.json mismatch and/or pending-test fail-closed gate.

**How you fixed/prevented it →** Rejected. Verifier file restored after the attack.

---

## 6. Spoofed result file (executed)

**Attack attempted →** Wrote grader/scratch/fake_pass.json with status PASS, then graded the failing starter.

**Command →** `npm run init:starter && npm run grade`

**What happened →** trusted latest.json status=FAIL; spoof file left untouched

**Assertion / protection →** Only scripts/grade.mjs writes grader/results/latest.json for an invocation.

**How you fixed/prevented it →** Spoof file is ignored.

---

## 7. Valid alternative serialization (executed)

**Attack attempted →** Used an equivalent page serialization condition (page !== 1).

**Command →** `mutate serializeParams + npm run grade`

**What happened →** status=PASS exit=0

**Assertion / protection →** Behavioral round-trip and UI assertions, not string-identical helper source.

**How you fixed/prevented it →** Accepted. Grader tolerates equivalent serialization.

---

## 8. Restore reference after attacks (executed)

**Attack attempted →** Re-apply reference/ and re-grade.

**Command →** `npm run apply:reference && npm run grade`

**What happened →** status=PASS exit=0

**Assertion / protection →** Cleanup confirmation.

**How you fixed/prevented it →** Workspace restored to the reference solution.

---

## Remaining vulnerabilities

- Local checkout is writable; editing `scripts/grade.mjs` can still bypass grading.
- Verifier sources are visible in-repo (same class of limitation as Env1 outside Harbor).
